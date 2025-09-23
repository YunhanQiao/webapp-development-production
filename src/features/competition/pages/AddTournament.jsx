import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { Tab, Tabs, Form } from "react-bootstrap";
import { useParams } from "react-router-dom";
import { FormProvider, useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllUsers, fetchCompetitionByID, saveAndUpdate, cancelWizardChangesAction } from "../competitionActions";
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
import { getTournamentNameAbbr, objectIdGenerator } from "../competitionServices";
import { format } from "date-fns/format";
import useTabHandlers from "../hooks/useTabHandlers";
import { convertWizardStateToTournament } from "../utils/wizardStateConverter";
import Modals from "./newTournament/shared/unsavedChangeModal";

// Utility to serialize dates in form data to prevent Redux serialization errors
const serializeDates = data => {
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
  const user = useSelector(state => state.user.user);

  const dispatch = useDispatch();
  const availableSteps = useSelector(availableStepsSelector);
  const activeTournament = useSelector(activeTournamentSelector);
  const wizardState = useSelector(wizardStateSelector);
  const wizardTournamentId = useSelector(wizardTournamentIdSelector);
  const dirtyTabs = useSelector(wizardDirtyTabsSelector);
  const [isUnsavedChangesModalOpen, setUnsavedChangesModalOpen] = useState(false);
  const [isExitConfirmationModalOpen, setExitConfirmationModalOpen] = useState(false);

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
  const markTabAsDirty = useCallback(tabName => {
    // This is now handled automatically by updateWizardTab action
    // We only need this for form-based changes, not wizard state changes
    console.log("🏷️ Tab marked as dirty:", tabName);
  }, []);

  // Function to clear dirty flags after successful save
  const clearDirtyFlags = useCallback(() => {
    console.log("🎨 UI-ONLY: Skipping clear dirty tabs dispatch");
  }, []);

  // On mount we check if there's an Id in the URL. If it exists, we add the tournament as active.
  useEffect(() => {
    if (id) {
      console.log("🎨 UI-ONLY: Skipping fetchCompetitionByID dispatch for id:", id);
    } else {
      console.log("🎨 UI-ONLY: Skipping tournament reset dispatches for new tournament");
    }
    console.log("🎨 UI-ONLY: Skipping fetchAllUsers dispatch");
    // On unmount, we reset to the default values
    return () => {
      console.log("🎨 UI-ONLY: Skipping cleanup dispatches on unmount");
    };
  }, [id]); // Removed dispatch from dependencies

  // Memoize tournament ID for consistent reference
  const activeTournamentId = useMemo(() => {
    return activeTournament?._id || activeTournament?.tournamentId;
  }, [activeTournament?._id, activeTournament?.tournamentId]);

  const [tournamentAbbr, setTournamentAbbr] = useState("New Tournament");
  const [tournamentYear, setTournamentYear] = useState(":");

  // const { setDataInLocalStorage } = useLocalStorageService();
  const { moveTab, handleTabClose, handleNextTab, handlePrevTab } = useTabHandlers(tab, id);

  const onSubmit = useCallback(
    next => async data => {
      try {
        console.log("🎯 UI-ONLY: Form submitted for tab:", tab);
        console.log("🎯 UI-ONLY: Form data received:", data);
        
        // In UI-only mode, we just log the data but don't save to Redux or backend
        console.log("� UI-ONLY: Skipping all Redux state updates and backend saves");

        // Just handle navigation
        if (next) {
          console.log("🎯 UI-ONLY: Navigating to next tab");
          handleNextTab();
        } else {
          console.log("🎯 UI-ONLY: Exiting wizard");
          handleTabClose();
        }
      } catch (error) {
        console.error("Error during UI-only navigation:", error);
      }
    },
    [tab, handleNextTab, handleTabClose],
  );

  // 🎯 UI-ONLY: Save function that just handles navigation without state updates
  const saveWizardState = useCallback(
    async next => {
      try {
        console.log("� UI-ONLY: saveWizardState called for tab:", tab);
        console.log("� UI-ONLY: Skipping validation and state updates");

        // In UI-only mode, just handle navigation
        if (next) {
          console.log("� UI-ONLY: Navigating to next tab");
          handleNextTab();
        } else {
          console.log("� UI-ONLY: Exiting wizard");
          handleTabClose();
        }
      } catch (error) {
        console.error("� UI-ONLY: Error during navigation:", error);
      }
    },
    [tab, handleNextTab, handleTabClose],
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
    const handleEscape = event => {
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
    console.log("🎨 UI-ONLY: User chose to discard changes - skipping state restore");

    try {
      console.log("🎨 UI-ONLY: Skipping cancelWizardChangesAction dispatch");
      console.log("🎨 UI-ONLY: Wizard state restore skipped");

      // Just close the modal and navigate
      setUnsavedChangesModalOpen(false);
      handleTabClose();
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
      const date = typeof startDate === "string" ? new Date(startDate + "T00:00:00") : startDate;
      setTournamentYear(`'${format(date, "yy")}:`);
    }
  }, [startDate, name]);

  // To update/reset defaultValues on tab change
  useEffect(() => {
    // 🎨 UI-ONLY: Always use clean default values, ignore wizard state and active tournament
    console.log("🎨 UI-ONLY: Resetting form to default values for tab:", tab);
    
    let dataToUse = defaultValues;
    
    // For UI-only mode, we ignore wizard state and active tournament data
    // This ensures users always start with empty/default forms
    console.log("🎨 UI-ONLY: Using default values:", dataToUse);

    // Special handling for basicInfo tab to ensure clean slate
    if (tab === "basicInfo") {
      const cleanData = {
        ...defaultValues, // Use clean default values
        // Ensure required fields are empty for new tournament
        name: "",
        startDate: "",
        endDate: "",
        tournamentShortName: "",
        admins: [],
      };
      reset(cleanData);
    } else {
      reset(dataToUse);
    }
  }, [tab, reset, defaultValues]);

  // Custom tab handler that syncs Basic Info dates when navigating away
  const handleTabSelect = useCallback(
    newTab => {
      // Continue with normal tab navigation
      moveTab(newTab);
    },
    [moveTab],
  );

  const tabs = useMemo(() => {
    return Object.keys(tabConfig).map(tab => {
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
  }, [availableSteps, errors, handlePrevTab, handleCancel, saveWizardState, handleNextTab]);

  return (
    <>
      <Navbar />
      <div className="mode-page action-dialog" tabIndex="0">
        <h1 id="tournamentFormHeader" className="mode-page-header">
          {`${activeTournament?.basicInfo?.uniqueName || watch("uniqueName") || "New Tournament"}: ${tabConfig[tab].name}`}
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