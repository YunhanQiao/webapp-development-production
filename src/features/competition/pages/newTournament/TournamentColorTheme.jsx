import "../../../../styles/features/competition/newTournament.css";
import { useDispatch, useSelector } from "react-redux";
import { wizardStateSelector } from "../../competitionSelectors";
import { updateWizardTab } from "../../competitionSlice";
import { useMemo, useEffect } from "react";

const TournamentColorTheme = () => {
  const dispatch = useDispatch();
  const wizardState = useSelector(wizardStateSelector);

  // 🔍 DEBUG: Log wizard state to see what's missing
  console.log("🎨 TournamentColorTheme Wizard State Debug:", {
    hasWizardState: !!wizardState,
    wizardStateKeys: wizardState ? Object.keys(wizardState) : [],
    hasColorTheme: !!wizardState?.colorTheme,
    colorThemeValue: wizardState?.colorTheme,
  });

  // Default color theme values
  const defaultColorTheme = useMemo(
    () => ({
      titleText: "#000000",
      headerRowBg: "#CC2127",
      headerRowTxt: "#ffffff",
      updateBtnBg: "#13294E",
      updateBtnTxt: "#FFFFFF",
      tournNameBannerBg: "#13294E",
      tournNameBannerTxt: "#FFFFFF",
      strParColBg: "#13294E",
      strParColTxt: "#FFFFFF",
      timeParColBg: "#13294E",
      timeParColTxt: "#FFFFFF",
      SGParColBg: "#000000",
      SGParColTxt: "#FFFFFF",
    }),
    [],
  );

  // Initialize colorTheme if it's missing from wizard state
  useEffect(() => {
    if (wizardState && (!wizardState.colorTheme || Object.keys(wizardState.colorTheme).length === 0)) {
      console.log("🎨 Initializing colorTheme in wizard state with defaults");
      dispatch(
        updateWizardTab({
          tab: "colorTheme",
          data: defaultColorTheme,
        }),
      );
    }
  }, [wizardState, dispatch, defaultColorTheme]);

  // 🎯 CONTROLLED COMPONENT: Use wizard state as source of truth for color theme
  const colorTheme = useMemo(() => {
    if (wizardState?.colorTheme && Object.keys(wizardState.colorTheme).length > 0) {
      return wizardState.colorTheme;
    }
    return defaultColorTheme;
  }, [wizardState?.colorTheme, defaultColorTheme]);

  // 🔍 DEBUG: Log color theme data in component
  console.log("🎨 TournamentColorTheme Component Debug:", {
    wizardState: wizardState,
    colorTheme: colorTheme,
    colorThemeKeys: Object.keys(colorTheme),
    sampleValues: {
      titleText: colorTheme.titleText,
      headerRowBg: colorTheme.headerRowBg,
      headerRowTxt: colorTheme.headerRowTxt,
    },
  });

  const renderColorInput = fieldName => {
    const value = colorTheme[fieldName] || "";

    const handleHexChange = e => {
      let newValue = e.target.value;
      // Add # if user starts typing without it
      if (newValue && !newValue.startsWith("#")) {
        newValue = "#" + newValue;
      }
      // Allow any input up to 7 characters (# plus 6 hex digits)
      if (newValue.length <= 7) {
        // Convert to uppercase and only allow valid hex characters
        newValue = newValue.toUpperCase().replace(/[^#A-F0-9]/g, "");

        // 🎯 UPDATE WIZARD STATE: Update color theme data in wizard state
        dispatch(
          updateWizardTab({
            tab: "colorTheme",
            data: { ...colorTheme, [fieldName]: newValue },
          }),
        );
      }
    };

    const handleColorChange = e => {
      const newValue = e.target.value.toUpperCase();

      // 🎯 UPDATE WIZARD STATE: Update color theme data in wizard state
      dispatch(
        updateWizardTab({
          tab: "colorTheme",
          data: { ...colorTheme, [fieldName]: newValue },
        }),
      );
    };

    return (
      <div key={fieldName} className="color-field">
        <label htmlFor={fieldName}>
          {fieldName.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase())}:
        </label>
        <div className="d-flex align-items-center gap-2">
          <input type="color" id={`color-${fieldName}`} value={value || "#000000"} onChange={handleColorChange} />
          <input
            type="text"
            id={fieldName}
            value={value || ""}
            className="form-control form-control-sm"
            style={{ width: "100px" }}
            onChange={handleHexChange}
            placeholder="#000000"
          />
        </div>
      </div>
    );
  };

  const renderColorInputGroup = (groupName, fields) => {
    return (
      <div key={groupName} className="mb-4">
        <h3>{groupName}</h3>
        {fields.map(fieldName => renderColorInput(fieldName))}
      </div>
    );
  };

  return (
    <div className="tournament-color-theme">
      {renderColorInputGroup("Leaderboard Coloring", [
        "titleText",
        "headerRowBg",
        "headerRowTxt",
        "updateBtnBg",
        "updateBtnTxt",
      ])}
      {renderColorInputGroup("Scorecard Coloring", [
        "tournNameBannerBg",
        "tournNameBannerTxt",
        "strParColBg",
        "strParColTxt",
        "timeParColBg",
        "timeParColTxt",
        "SGParColBg",
        "SGParColTxt",
      ])}
    </div>
  );
};

export default TournamentColorTheme;
