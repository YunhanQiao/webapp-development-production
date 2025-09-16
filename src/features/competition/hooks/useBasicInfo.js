import { MAX_IMAGE_SIZE_IN_KB } from "features/competition/constants";
import { useFormContext } from "react-hook-form";
import { useEffect, useState, useCallback } from "react";
import { formatDate } from "services/competitionServices";

// 🚀 Admin functionality working correctly - v1.0
const useBasicInfo = ({
  adminList,
  setAdminList,
  setLogo,
  setRulesDocName,
  setPrizeDocName,
  setAdditionalInfoDocName,
  setShowFileSizeErrorModal,
  dispatch,
  basicInfo,
  updateWizardTab,
}) => {
  const {
    watch,
    setValue,
    getValues,
    formState: { defaultValues },
    ...methods
  } = useFormContext();

  const [logoState, setLogoState] = useState(getValues("logo"));
  const [rulesDocState, setRulesDocState] = useState(getValues("rules"));
  const [prizeTextState, setPrizeTextState] = useState(getValues("prizeText"));
  const [prizeDocState, setPrizeDocState] = useState(getValues("prizeDoc"));
  const [additionalInfoTextState, setAdditionalInfoTextState] = useState(getValues("additionalInfoText"));
  const [additionalInfoDocState, setAdditionalInfoDocState] = useState(getValues("additionalInfoDoc"));

  const handleTournamentLogoUpload = useCallback(
    file => {
      if (!file) return;
      if (file.size <= MAX_IMAGE_SIZE_IN_KB * 1024) {
        var reader = new FileReader();
        reader.onload = function () {
          const logoData = reader.result;

          // Update local state and form
          setLogo(logoData);
          setValue("logo", logoData);
          setLogoState(logoData);

          // Update wizard state for controlled component pattern
          dispatch(
            updateWizardTab({
              tab: "basicInfo",
              data: { ...basicInfo, logo: logoData },
            }),
          );
        };
        reader.readAsDataURL(file);
      } else {
        setShowFileSizeErrorModal(true);
      }
    },
    [setLogo, setValue, setShowFileSizeErrorModal, dispatch, updateWizardTab, basicInfo],
  );

  const handleDeleteLogo = useCallback(() => {
    // Update local state and form
    setLogo(null);
    setValue("logo", null);
    setLogoState(null);

    // Update wizard state for controlled component pattern
    dispatch(
      updateWizardTab({
        tab: "basicInfo",
        data: { ...basicInfo, logo: null },
      }),
    );
  }, [setLogo, setValue, dispatch, updateWizardTab, basicInfo]);

  const handleTournamentRulesUpload = useCallback(
    file => {
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        const rulesData = reader.result;

        // Update local state and form
        setValue("rules", rulesData);
        setRulesDocName(file.name);
        setRulesDocState(rulesData);

        // Update wizard state for controlled component pattern
        dispatch(
          updateWizardTab({
            tab: "basicInfo",
            data: { ...basicInfo, rules: rulesData },
          }),
        );
      };
      reader.readAsDataURL(file);
    },
    [setValue, setRulesDocName, dispatch, updateWizardTab, basicInfo],
  );

  const handleTournamentPrizesUpload = useCallback(
    file => {
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        const prizeDocData = reader.result;

        // Update local state and form
        setValue("prizeDoc", prizeDocData);
        setPrizeDocName(file.name);
        setPrizeDocState(prizeDocData);
        setValue("prizeText", "");
        setPrizeTextState("");

        // Update wizard state for controlled component pattern
        dispatch(
          updateWizardTab({
            tab: "basicInfo",
            data: { ...basicInfo, prizeDoc: prizeDocData, prizeText: "" },
          }),
        );
      };
      reader.readAsDataURL(file);
    },
    [setValue, setPrizeDocName, dispatch, updateWizardTab, basicInfo],
  );

  const handleTournamentAdditionalInfoUpload = useCallback(
    file => {
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        const additionalInfoDocData = reader.result;

        // Update local state and form
        setValue("additionalInfoDoc", additionalInfoDocData);
        setAdditionalInfoDocName(file.name);
        setAdditionalInfoDocState(additionalInfoDocData);
        setValue("additionalInfoText", "");
        setAdditionalInfoTextState("");

        // Update wizard state for controlled component pattern
        dispatch(
          updateWizardTab({
            tab: "basicInfo",
            data: { ...basicInfo, additionalInfoDoc: additionalInfoDocData, additionalInfoText: "" },
          }),
        );
      };
      reader.readAsDataURL(file);
    },
    [setValue, setAdditionalInfoDocName, dispatch, updateWizardTab, basicInfo],
  );

  useEffect(() => {
    const logoFromForm = getValues("logo");
    if (logoFromForm && !logoState) {
      setLogoState(logoFromForm);
      setLogo(logoFromForm);
    }
  }, [defaultValues, logoState, setLogo, getValues]);

  useEffect(() => {
    const startDate = getValues("startDate");
    const endDate = getValues("endDate");

    setValue("startDate", formatDate(startDate));
    setValue("endDate", formatDate(endDate));

    // Logo state management
    if (!logoState) {
      const logoFromForm = getValues("logo");
      if (logoFromForm) {
        setLogoState(logoFromForm);
        setLogo(logoFromForm);
      }
    } else {
      setValue("logo", logoState);
    }

    if (!rulesDocState) {
      const rulesDocFromForm = getValues("rules");
      if (rulesDocFromForm) {
        setRulesDocState(rulesDocFromForm);
        if (typeof rulesDocFromForm === "string" && rulesDocFromForm.includes("s3.")) {
          const fileName = rulesDocFromForm.split("/").pop() || "rules.pdf";
          setRulesDocName(fileName);
        } else {
          setRulesDocName("rules.pdf");
        }
      }
    } else {
      setValue("rules", rulesDocState);
    }
    if (!prizeDocState) {
      const prizeDocFromForm = getValues("prizeDoc");
      if (prizeDocFromForm) {
        setPrizeDocState(prizeDocFromForm);
        if (typeof prizeDocFromForm === "string" && prizeDocFromForm.includes("s3.")) {
          const fileName = prizeDocFromForm.split("/").pop() || "prize.pdf";
          setPrizeDocName(fileName);
        } else {
          setPrizeDocName("prize.pdf");
        }
      }
    } else {
      setValue("prizeDoc", prizeDocState);
    }

    if (!additionalInfoDocState) {
      const additionalInfoDocFromForm = getValues("additionalInfoDoc");
      if (additionalInfoDocFromForm) {
        setAdditionalInfoDocState(additionalInfoDocFromForm);
        if (typeof additionalInfoDocFromForm === "string" && additionalInfoDocFromForm.includes("s3.")) {
          const fileName = additionalInfoDocFromForm.split("/").pop() || "additionalInfo.pdf";
          setAdditionalInfoDocName(fileName);
        } else {
          setAdditionalInfoDocName("additionalInfo.pdf");
        }
      }
    } else {
      setValue("additionalInfoDoc", additionalInfoDocState);
    }

    if (!prizeTextState) {
      const prizeTextFromForm = getValues("prizeText");
      if (prizeTextFromForm) {
        setPrizeTextState(prizeTextFromForm);
      }
    } else {
      setValue("prizeText", prizeTextState);
    }

    if (!additionalInfoTextState) {
      const additionalInfoTextFromForm = getValues("additionalInfoText");
      if (additionalInfoTextFromForm) {
        setAdditionalInfoTextState(additionalInfoTextFromForm);
      }
    } else {
      setValue("additionalInfoText", additionalInfoTextState);
    }
  }, [
    defaultValues,
    logoState,
    rulesDocState,
    prizeDocState,
    prizeTextState,
    additionalInfoTextState,
    additionalInfoDocState,
    setLogo,
    setRulesDocName,
    setPrizeDocName,
    setAdditionalInfoDocName,
    setValue,
    getValues,
  ]);

  // 🎯 ADMIN MANAGEMENT FUNCTIONS - Using controlled component approach
  const addAdmin = useCallback(
    (adminId, adminEmail) => {
      if (!adminId) {
        console.warn("addAdmin: Missing adminId", { adminId });
        return;
      }

      // Check if admin already exists
      if (adminList.has(adminId)) {
        console.warn("addAdmin: Admin already exists", { adminId });
        return;
      }

      // Add admin to the set and update wizardState
      const newAdminList = new Set(adminList);
      newAdminList.add(adminId);
      setAdminList(newAdminList);
    },
    [adminList, setAdminList],
  );

  const removeAdmin = useCallback(
    adminId => {
      if (!adminId) {
        console.warn("removeAdmin: Missing adminId", { adminId });
        return;
      }

      // Remove admin from the set and update wizardState
      const newAdminList = new Set(adminList);
      newAdminList.delete(adminId);
      setAdminList(newAdminList);
    },
    [adminList, setAdminList],
  );

  return {
    methods,
    addAdmin,
    removeAdmin,
    handleTournamentLogoUpload,
    handleDeleteLogo,
    handleTournamentRulesUpload,
    handleTournamentPrizesUpload,
    handleTournamentAdditionalInfoUpload,
  };
};

export default useBasicInfo;
