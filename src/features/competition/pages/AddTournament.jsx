import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";
import { Tab, Tabs, Form } from "react-bootstrap";
import { useParams } from "react-router-dom";
import { FormProvider, useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAllUsers,
  fetchCompetitionByID,
  saveAndUpdate,
  cancelWizardChangesAction,
} from "../competitionActions";
import {
  activeTournamentSelector,
  availableStepsSelector,
  wizardStateSelector,
  wizardTournamentIdSelector,
  wizardDirtyTabsSelector,
} from "../competitionSelectors";
import {
  resetAvailableSteps,
  setActiveTournamentAction,
  updateActiveTournamentAction,
  updateWizardTab,
  clearWizardState,
  setWizardTournamentId,
  clearDirtyTabs,
} from "../competitionSlice";

import { tabConfig } from "features/competition/tabConfig.js";
import useLocalStorageService from "features/competition/useLocalStorageService.js";

import Navbar from "../../shared/Navbar/Navbar";
import NewTournamentFooter from "./newTournament/shared/NewTournamentFooter";
import ErrorBox from "../../shared/BaseFormComponents/ErrorBox";

import { yupResolver } from "@hookform/resolvers/yup";
import {
  getTournamentNameAbbr,
  objectIdGenerator,
} from "../competitionServices";
import { format } from "date-fns/format";
import useTabHandlers from "../hooks/useTabHandlers";
import { convertWizardStateToTournament } from "../utils/wizardStateConverter";
import Modals from "./newTournament/shared/unsavedChangeModal";

// Utility to serialize dates in form data to prevent Redux serialization errors
const serializeDates = (data) => {
  if (data === null || data === undefined) return data;

  if (data instanceof Date) {
    // Convert Date objects to YYYY-MM-DD format
    const year = data.getFullYear();
    const month = String(data.getMonth() + 1).padStart(2, "0");
    const day = String(data.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  if (Array.isArray(data)) {
    return data.map(serializeDates);
  }

  if (typeof data === "object") {
    const serialized = {};
    for (const [key, value] of Object.entries(data)) {
      serialized[key] = serializeDates(value);
    }
    return serialized;
  }

  return data;
};

const AddTournament = () => {
  const { tab, id } = useParams();

  // Get user info from Redux (must be in component scope for use in handlers)
  const user = useSelector((state) => state.user.user);

  const dispatch = useDispatch();
  const availableSteps = useSelector(availableStepsSelector);
  const activeTournament = useSelector(activeTournamentSelector);
  const wizardState = useSelector(wizardStateSelector);
  const wizardTournamentId = useSelector(wizardTournamentIdSelector);
  const dirtyTabs = useSelector(wizardDirtyTabsSelector);
  const [isUnsavedChangesModalOpen, setUnsavedChangesModalOpen] =
    useState(false);
  const [isExitConfirmationModalOpen, setExitConfirmationModalOpen] =
    useState(false);

  const [isDirty, setIsDirty] = useState(false);
  // Track which tabs have been modified to avoid resetting them with Redux data
  const [modifiedTabs, setModifiedTabs] = useState(new Set());
  // Store form values for modified tabs
  const [savedFormValues, setSavedFormValues] = useState({});

  // Track the last initialized tournament ID to prevent infinite loops
  const lastInitializedTournamentId = useRef(null);
  // Track when we're in the middle of a save to prevent re-initialization
  const isSaving = useRef(false);

  // Function to mark a tab as dirty (modified) - now using Redux
  const markTabAsDirty = useCallback((tabName) => {
    // This is now handled automatically by updateWizardTab action
    // We only need this for form-based changes, not wizard state changes
    console.log("🏷️ Tab marked as dirty:", tabName);
  }, []);

  // Function to clear dirty flags after successful save
  const clearDirtyFlags = useCallback(() => {
    dispatch(clearDirtyTabs());
  }, [dispatch]);

  // On mount we check if there's an Id in the URL. If it exists, we add the tournament as active.
  useEffect(() => {
    if (id) {
      dispatch(fetchCompetitionByID(id));
      // After fetching, the tournament will be set as active and we'll initialize wizard state
    } else {
      // Creating new tournament, clear existing active tournament
      dispatch(setActiveTournamentAction(null));
      dispatch(resetAvailableSteps());
      dispatch(clearWizardState());
    }
    dispatch(fetchAllUsers());
    // On unmount, we reset to the default values
    return () => {
      dispatch(setActiveTournamentAction(null));
      dispatch(resetAvailableSteps());
      dispatch(clearWizardState());
    };
  }, [id, dispatch]); // Added id and dispatch to dependencies

  // Memoize tournament ID for consistent reference
  const activeTournamentId = useMemo(() => {
    return activeTournament?._id || activeTournament?.tournamentId;
  }, [activeTournament?._id, activeTournament?.tournamentId]);

  const [tournamentAbbr, setTournamentAbbr] = useState("New Tournament");
  const [tournamentYear, setTournamentYear] = useState(":");

  // const { setDataInLocalStorage } = useLocalStorageService();
  const { moveTab, handleTabClose, handleNextTab, handlePrevTab } =
    useTabHandlers(tab, id);

  const onSubmit = useCallback(
    (next) => async (data) => {
      try {
        console.log("🎯 onSubmit called with form data:", data);
        console.log("🎯 onSubmit - current tab:", tab);
        console.log("🎯 onSubmit - form data name field:", data?.name);

        // Use wizard state as primary source for tournament ID, fallback to activeTournament for legacy support
        const tournamentId = wizardTournamentId || activeTournament?._id || -1;
        const tabsToSave = [];

        // 1. Always include the current tab being saved
        let currentTabData;
        if (tab === "basicInfo" && data && data.endDate) {
          // For basicInfo, always use the API-formatted data if it has a calculated endDate
          console.log(
            `🎯 Using API-formatted data for current tab (${tab})`,
            data,
          );
          currentTabData = { ...data };
        } else if (wizardState && wizardState[tab]) {
          console.log(
            `🎯 Using wizard state data for current tab (${tab})`,
            wizardState[tab],
          );
          currentTabData = { ...wizardState[tab] };
        } else {
          console.log(
            `⚠️ Fallback to form data for current tab (${tab})`,
            data,
          );
          currentTabData = serializeDates(data);
        }

        // Ensure tournamentCreatorName and tournamentCreatorEmail are present for basicInfo
        if (tab === "basicInfo") {
          if (!currentTabData.tournamentCreatorName) {
            currentTabData.tournamentCreatorName = user
              ? `${user.personalInfo?.firstName || ""} ${user.personalInfo?.lastName || ""}`.trim()
              : "";
          }
          if (!currentTabData.tournamentCreatorEmail) {
            currentTabData.tournamentCreatorEmail =
              user?.accountInfo?.email || "";
          }
        }

        tabsToSave.push({ tab, data: currentTabData });

        // 2. Check for other modified tabs using dirty flags
        if (dirtyTabs.length > 0) {
          const tabsToCheck = [
            "basicInfo",
            "divisions",
            "coursesInfo",
            "registrationInfo",
            "regPaymentInfo",
          ];

          for (const checkTab of tabsToCheck) {
            if (
              checkTab !== tab &&
              dirtyTabs.includes(checkTab) &&
              wizardState[checkTab]
            ) {
              // This tab has been marked as dirty and has data in wizard state
              tabsToSave.push({ tab: checkTab, data: wizardState[checkTab] });
            }
          }
        }

        console.log(
          `💾 Saving ${tabsToSave.length} tab(s):`,
          tabsToSave.map((t) => t.tab),
        );

        // 3. Save all modified tabs
        for (const { tab: saveTab, data: saveData } of tabsToSave) {
          try {
            const schema = { [saveTab]: saveData };
            if (saveTab === "regPaymentInfo") {
              console.log(
                "[DEBUG] Attempting to save regPaymentInfo tab:",
                JSON.stringify(schema, null, 2),
              );
            }
            console.log(`Saving tab: ${saveTab}`, {
              tournamentId,
              tab: saveTab,
              schema,
            });
            const saveResult = await dispatch(
              saveAndUpdate({
                id: tournamentId,
                tab: saveTab,
                schema,
                skipActiveTournamentUpdate: false, // Update activeTournament to match wizard state
              }),
            );
            console.log(`✅ Successfully saved tab: ${saveTab}`, saveResult);
          } catch (error) {
            console.error(`❌ Failed to save tab: ${saveTab}`, error);
            // Don't throw - continue with other saves, but log the error
            // This allows us to see which specific saves are failing
          }
        }

        console.log("All saves completed, navigating...", { next });

        // Clear dirty flags after successful saves
        clearDirtyFlags();

        // 🎯 CONTROLLED COMPONENTS ARCHITECTURE: After successful saves,
        // activeTournament now matches wizardState (clean state = dirty state)

        if (next) {
          handleNextTab();
        } else {
          handleTabClose();
        }
      } catch (error) {
        console.error("Error during save operation:", error);
        setIsDirty(false);
      }
    },
    [
      tab,
      activeTournament,
      wizardState,
      wizardTournamentId,
      dirtyTabs,
      clearDirtyFlags,
      dispatch,
      handleNextTab,
      handleTabClose,
    ],
  );

  // 🎯 WIZARD STATE SAVE: Custom save function that validates wizard state instead of form state
  const saveWizardState = useCallback(
    async (next) => {
      try {
        console.log(
          "🎯 saveWizardState called, validating wizard state instead of form",
        );

        // Set saving flag to prevent wizard state re-initialization during save
        isSaving.current = true;

        // For basicInfo tab, validate wizard state data directly
        if (tab === "basicInfo" && wizardState?.basicInfo) {
          const basicInfoData = wizardState.basicInfo;
          console.log("🎯 Validating wizard state basicInfo:", basicInfoData);

          // Manual validation of required fields
          if (!basicInfoData.name || basicInfoData.name.trim() === "") {
            throw new Error("Tournament Name is a required field");
          }
          if (!basicInfoData.startDate) {
            throw new Error("Start Date is a required field");
          }
          if (
            basicInfoData.endDateOffset === undefined ||
            basicInfoData.endDateOffset === null
          ) {
            throw new Error("Tournament duration is required");
          }

          console.log(
            "🎯 Wizard state validation passed, proceeding with save",
          );

          // 🎯 CONVERT WIZARD STATE TO API FORMAT: Use converter to properly format dates
          console.log(
            "🎯 Converting wizard state to tournament format for API",
          );
          console.log("🎯 INPUT - Full wizard state:", wizardState);
          console.log("🎯 INPUT - basicInfo from wizard state:", basicInfoData);

          const tournamentData = convertWizardStateToTournament(wizardState);
          const apiFormattedBasicInfo = tournamentData.basicInfo;

          console.log("🎯 OUTPUT - Converted tournament data:", tournamentData);
          console.log(
            "🎯 OUTPUT - API formatted basicInfo:",
            apiFormattedBasicInfo,
          );
          console.log(
            "🎯 COMPARISON - startDate: wizard='%s' → api='%s'",
            basicInfoData.startDate,
            apiFormattedBasicInfo?.startDate,
          );
          console.log(
            "🎯 COMPARISON - endDate: wizard offset='%s' → api='%s'",
            basicInfoData.endDateOffset,
            apiFormattedBasicInfo?.endDate,
          );

          // Call the onSubmit logic with properly formatted data
          console.log("🎯 Calling onSubmit with API formatted data...");
          await onSubmit(next)(apiFormattedBasicInfo);

          // 🎯 CONTROLLED COMPONENTS ARCHITECTURE: After successful saves,
          // activeTournament now matches wizardState (clean state = dirty state)

          return;
        }

        // For other tabs, we need to handle them properly
        if (tab === "regPaymentInfo" && wizardState?.regPaymentInfo) {
          console.log(
            "🎯 Processing regPaymentInfo tab with wizard state data",
          );
          console.log("🎯 Wizard regPaymentInfo:", wizardState.regPaymentInfo);
          console.log(
            "🎯 Start date for transformation:",
            wizardState?.basicInfo?.startDate,
          );

          // Use wizard state data directly - it will be transformed in the action layer
          await onSubmit(next)(wizardState.regPaymentInfo);
          return;
        }

        // For other tabs, call onSubmit with empty data - this will use wizard state
        console.log(
          "🎯 Non-basicInfo/regPaymentInfo tab, calling onSubmit directly",
        );
        await onSubmit(next)({});
      } catch (error) {
        console.error("🎯 Wizard state validation failed:", error);
        // Show validation error to user
        // You might want to set a state here to show the error in the UI
        alert(error.message); // Temporary - replace with proper error handling
      } finally {
        // Clear saving flag to allow wizard state re-initialization again
        isSaving.current = false;
      }
    },
    [tab, wizardState, onSubmit],
  );

  const { schema, defaultValues } = tabConfig[tab];

  // Each tab receives its schema and default values from the config.
  const methods = useForm({
    resolver: yupResolver(schema),
    shouldUnregister: true,
    defaultValues,
    reValidateMode: "onSubmit",
  });

  const {
    watch,
    reset,
    handleSubmit,
    formState: { errors, isDirty: formIsDirty },
  } = methods;

  useEffect(() => {
    setIsDirty(formIsDirty);
    // Mark current tab as dirty when form becomes dirty
    if (formIsDirty) {
      markTabAsDirty(tab);
    }
  }, [formIsDirty, tab, markTabAsDirty]);

  // Handle Escape key press globally
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        if (isUnsavedChangesModalOpen || isExitConfirmationModalOpen) {
          setUnsavedChangesModalOpen(false);
          setExitConfirmationModalOpen(false);
        } else if (isDirty) {
          setUnsavedChangesModalOpen(true);
        } else {
          setExitConfirmationModalOpen(true);
        }
        event.preventDefault();
        event.stopPropagation();
      }
    };

    document.addEventListener("keydown", handleEscape, true);
    return () => {
      document.removeEventListener("keydown", handleEscape, true);
    };
  }, [isDirty, isUnsavedChangesModalOpen, isExitConfirmationModalOpen]);

  const handleModalClose = () => {
    setUnsavedChangesModalOpen(false);
    setExitConfirmationModalOpen(false);
  };

  const handleConfirmSave = () => {
    saveWizardState(false); // Save changes
    setUnsavedChangesModalOpen(false); // Close modal
  };

  const handleDiscardChanges = async () => {
    console.log(
      "🚫 User chose to discard changes - restoring from last saved state",
    );

    try {
      // Restore wizard state from last saved activeTournament
      await dispatch(cancelWizardChangesAction());
      console.log("✅ Wizard state restored from last saved data");

      // Reset form to the restored data (will trigger in the next useEffect cycle)
      setModifiedTabs({}); // Clear modified flags

      setUnsavedChangesModalOpen(false); // Close modal
      handleTabClose(); // Close and exit page
    } catch (error) {
      console.error("❌ Error discarding changes:", error);
      setUnsavedChangesModalOpen(false); // Close modal anyway
      handleTabClose(); // Close and exit page
    }
  };

  const handleConfirmExit = () => {
    setExitConfirmationModalOpen(false);
    handleTabClose();
  };

  // 🎯 CLEAN/DIRTY STATE: Proper cancel handler that checks for unsaved changes
  const handleCancel = useCallback(() => {
    if (isDirty) {
      // There are unsaved changes - show confirmation modal
      setUnsavedChangesModalOpen(true);
    } else {
      // No unsaved changes - exit directly
      handleTabClose();
    }
  }, [isDirty, handleTabClose]);

  // Moved the logic for heading out of basic info, automatic heading change when tournamentName or startDate is modified.
  const startDate = watch("startDate");
  const name = watch("name");

  useEffect(() => {
    if (name) {
      setTournamentAbbr(getTournamentNameAbbr(name));
    }

    if (startDate) {
      // Use a more timezone-safe approach for date parsing
      const date =
        typeof startDate === "string"
          ? new Date(startDate + "T00:00:00")
          : startDate;
      setTournamentYear(`'${format(date, "yy")}:`);
    }
  }, [startDate, name]);

  // To update/reset defaultValues on tab change
  useEffect(() => {
    // If this tab has saved form values (user made changes), use those instead of Redux
    if (modifiedTabs.has(tab) && savedFormValues[tab]) {
      reset(savedFormValues[tab]);
      return;
    }

    // Priority: wizard state > activeTournament > defaultValues
    let dataToUse = defaultValues;

    // 🎯 CONTROLLED COMPONENTS ARCHITECTURE: wizard state is dirty state, activeTournament is clean state
    // Always prefer wizard state when available (this is the user's current working data)

    // Since we renamed divisionsInfo to divisions for consistency,
    // tab names now map directly to wizard state properties
    if (
      wizardState &&
      wizardState[tab] !== null &&
      wizardState[tab] !== undefined
    ) {
      dataToUse = wizardState[tab];
    }
    // Fall back to activeTournament if wizard state doesn't have the tab data (clean state)
    else if (
      activeTournament &&
      activeTournament[tab] !== null &&
      activeTournament[tab] !== undefined
    ) {
      dataToUse = activeTournament[tab];
    }

    // Special handling for basicInfo tab to fix date formats
    if (tab === "basicInfo") {
      const fixedData = {
        ...defaultValues, // Start with default values to ensure all fields exist
        ...dataToUse, // Override with actual data
        // Fix date format for HTML date inputs
        ...(dataToUse.startDate &&
          typeof dataToUse.startDate === "string" && {
            startDate: dataToUse.startDate.includes("T")
              ? dataToUse.startDate.split("T")[0]
              : dataToUse.startDate,
          }),
        // For offset-based system, preserve endDateOffset instead of endDate
        ...(dataToUse.endDateOffset !== undefined && {
          endDateOffset: dataToUse.endDateOffset,
        }),
        // For editing tournaments, preserve uniqueName
        ...((wizardTournamentId || activeTournament?._id) &&
          activeTournament?.basicInfo?.uniqueName && {
            uniqueName: activeTournament.basicInfo.uniqueName,
          }),
        // Ensure admins field is always present
        admins: dataToUse.admins || [],
      };
      reset(fixedData);
    } else {
      reset(dataToUse);
    }
  }, [
    activeTournament,
    wizardState,
    wizardTournamentId,
    tab,
    reset,
    defaultValues,
    id,
    modifiedTabs,
    savedFormValues,
  ]);

  // Custom tab handler that syncs Basic Info dates when navigating away
  const handleTabSelect = useCallback(
    (newTab) => {
      // Continue with normal tab navigation
      moveTab(newTab);
    },
    [moveTab],
  );

  const tabs = useMemo(() => {
    return Object.keys(tabConfig).map((tab) => {
      const { component: TabComponent, name } = tabConfig[tab];

      return (
        <Tab
          key={tab}
          eventKey={tab}
          title={name}
          className="mx-3"
          transition={false}
          disabled={!availableSteps.includes(tab)}
        >
          {tab !== "rounds" && <ErrorBox errors={errors} entity="tournament" />}
          <Form>
            <TabComponent />
            <NewTournamentFooter
              handlePrevious={handlePrevTab}
              handleCancel={handleCancel}
              handleSaveExit={() => saveWizardState(false)}
              handleSaveNext={handleNextTab && (() => saveWizardState(true))}
            />
          </Form>
        </Tab>
      );
    });
  }, [
    availableSteps,
    errors,
    handlePrevTab,
    handleCancel,
    saveWizardState,
    handleNextTab,
  ]);

  return (
    <>
      <Navbar />
      <div className="mode-page action-dialog" tabIndex="0">
        <h1 id="tournamentFormHeader" className="mode-page-header">
          {activeTournament?.basicInfo?.uniqueName ||
            wizardState?.basicInfo?.uniqueName ||
            "New Tournament"}
        </h1>
        <FormProvider {...methods}>
          <Tabs
            id="controlled-tab-example"
            activeKey={tab}
            onSelect={handleTabSelect}
            className="mb-3 mx-3"
            transition={false}
            // Each tab should mount/unmount separately
            mountOnEnter
            unmountOnExit
          >
            {tabs}
          </Tabs>
        </FormProvider>
      </div>
      <Modals.UnsavedChangesModal
        isOpen={isUnsavedChangesModalOpen}
        onConfirm={handleConfirmSave}
        onCancel={handleDiscardChanges}
        onClose={handleModalClose}
      />
      <Modals.ExitConfirmationModal
        isOpen={isExitConfirmationModalOpen}
        onConfirm={handleConfirmExit}
        onClose={handleModalClose}
      />
    </>
  );
};

export default AddTournament;
