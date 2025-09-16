import { useMemo, useEffect } from "react";
import Button from "react-bootstrap/Button";
import { useSelector, useDispatch } from "react-redux";
import { generateDayOptions } from "../../../../../utils/dateOffsetUtils";
import { teesetsSelector } from "../../../competitionSelectors";
import { fetchTeesets } from "../../../competitionActions";

const DivisionsList = ({
  currency,
  divisions,
  tournamentStartDate,
  tournamentEndDate,
  editDivision,
  deleteDivision,
}) => {
  const dispatch = useDispatch();
  const coursesInDB = useSelector(state => state.courses);
  const teesets = useSelector(teesetsSelector);

  // Fetch teesets if not already loaded
  useEffect(() => {
    if (!teesets || teesets.length === 0) {
      dispatch(fetchTeesets());
    }
  }, [dispatch, teesets]);

  // Use passed tournament dates (current form values)
  const startDate = tournamentStartDate;
  const endDate = tournamentEndDate;

  // Use useMemo to create a lookup for course names using courseId
  const coursesDB = useMemo(() => {
    return coursesInDB.reduce((acc, course) => {
      acc[course.id] = course; // Assuming each course has a unique `id`
      return acc;
    }, {});
  }, [coursesInDB]);

  return (
    <>
      {divisions.map((division, index) => (
        <Division
          key={index}
          currency={currency}
          coursesDB={coursesDB}
          teesets={teesets}
          tournamentStartDate={startDate}
          tournamentEndDate={endDate}
          onEdit={() => editDivision(division, index)}
          onDelete={() => deleteDivision(index)}
          {...division}
        />
      ))}
    </>
  );
};

const Division = ({
  currency,
  id,
  name,
  entryFee,
  gender,
  minAge,
  maxAge,
  rounds,
  onEdit,
  onDelete,
  coursesDB,
  teesets,
  tournamentStartDate,
  tournamentEndDate,
}) => {
  // Helper function to format round information with dates
  const formatRoundInfo = (round, index) => {
    const fullCourseName = coursesDB[round.courseId]?.name || "Unknown Course";
    // Extract just the course name up to the first comma
    const courseName = fullCourseName.split(",")[0].trim();

    // Convert tournament dates to YYYY-MM-DD format (timezone-neutral)
    const toDateString = date => {
      if (!date) return null;
      if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
      if (typeof date === "string" && date.includes("T")) return date.split("T")[0];
      if (date instanceof Date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      }
      return String(date);
    };

    const startDateFormatted = toDateString(tournamentStartDate);
    const endDateFormatted = toDateString(tournamentEndDate);

    let dateDisplay = "";

    if (startDateFormatted && endDateFormatted) {
      // If round has dayOffset (new format), use it
      if (typeof round.dayOffset === "number") {
        const dayOptions = generateDayOptions(startDateFormatted, endDateFormatted);
        const dayOption = dayOptions.find(option => option.value === round.dayOffset);
        if (dayOption) {
          // Use the date directly from the option
          const date = new Date(dayOption.date + "T00:00:00");
          const formattedDate = date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          });
          dateDisplay = `(${formattedDate})`;
        } else {
          // Fallback: use the computed date directly
          if (round.date) {
            const date = new Date(round.date);
            if (!isNaN(date.getTime())) {
              const formattedDate = date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });
              dateDisplay = `(${formattedDate})`;
              console.log(`Using computed date ${round.date} → ${formattedDate}`);
            }
          }
        }
      }
      // If round has absolute date (legacy format), check for stale dates first
      else if (round.date) {
        console.log(`Using date path for round ${index}: ${round.date}`);
        // Check for stale dates (same logic as DivisionRound component)
        const roundDate = new Date(round.date);
        const tournamentStart = new Date(startDateFormatted);
        const isStaleDate = roundDate < tournamentStart;

        if (isStaleDate) {
          console.log(`Stale date detected for round ${index}, using fallback`);
          // Use position-based fallback (Round 1 = Day 1, Round 2 = Day 2, etc.)
          const fallbackDayOffset = index;
          const dayOptions = generateDayOptions(startDateFormatted, endDateFormatted);
          const dayOption = dayOptions.find(option => option.value === fallbackDayOffset);

          if (dayOption) {
            const date = new Date(dayOption.date + "T00:00:00");
            const formattedDate = date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });
            dateDisplay = `(${formattedDate})`;
          }
        } else {
          // Date is valid, use it directly
          const date = new Date(round.date);
          if (!isNaN(date.getTime())) {
            const formattedDate = date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });
            dateDisplay = `(${formattedDate})`;
            console.log(`Valid date ${round.date} → ${formattedDate}`);
          }
        }
      } else {
        console.log(`No date or dayOffset found for round ${index}`);
      }
    }

    // Get tee information
    let teeInfo = "";
    if (round.teeId && teesets) {
      const tee = teesets.find(t => t._id === round.teeId || t.id === round.teeId);
      if (tee?.name) {
        teeInfo = ` (${tee.name})`;
      }
    }

    const result = `Round ${index + 1} ${dateDisplay}: ${courseName}${teeInfo}`;
    return result;
  };

  return (
    <tr>
      <td>{name}</td>
      <td>
        {currency} {entryFee}
      </td>
      <td>{gender}</td>
      <td>{minAge}</td>
      <td>{maxAge}</td>
      <td>
        {rounds.map((round, index) => (
          <div key={`${round.courseId}-${index}`} style={{ marginBottom: index < rounds.length - 1 ? "4px" : "0" }}>
            {formatRoundInfo(round, index)}
          </div>
        ))}
      </td>
      <td>
        <Button
          type="button"
          onClick={onEdit}
          style={{
            backgroundColor: "#13294e",
            color: "white",
            border: "1px solid #13294e",
            marginRight: "8px",
          }}
        >
          <span className="fas fa-edit" />
          &nbsp; Edit
        </Button>
        <Button variant="danger" type="button" onClick={onDelete}>
          <span className="fas fa-trash" />
          &nbsp; Delete
        </Button>
      </td>
    </tr>
  );
};

export default DivisionsList;
