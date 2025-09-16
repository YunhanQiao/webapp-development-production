// Reference for customizations during future development - https://www.npmjs.com/package/react-search-autocomplete
import { ReactSearchAutocomplete } from "react-search-autocomplete";
import { useEffect, useRef, useCallback } from "react";

const AutoCompleteSearch = ({ dataList, placeholder, setSelectedValue }) => {
  const searchRef = useRef(null);
  const dropdownRef = useRef(null);

  const handleOnSelect = item => {
    setSelectedValue(item);
  };

  const handleOnHover = result => {
    // Optional: Handle hover events if needed
  };

  const handleOnFocus = () => {
    // Optional: Handle focus events if needed
  };

  // Prevent dropdown from closing when scrolling
  const handleScrollbarInteraction = useCallback(event => {
    // Prevent the event from bubbling up and causing focus loss
    event.stopPropagation();
    event.preventDefault = false; // Allow scrolling
  }, []);

  // Enhanced keyboard navigation with auto-scrolling
  useEffect(() => {
    const handleKeyDown = event => {
      if (["ArrowDown", "ArrowUp", "Enter"].includes(event.key)) {
        // Small delay to let the library handle the selection first
        setTimeout(() => {
          const dropdownContainer =
            document.querySelector('.admin-modal .react-search-autocomplete [data-test="results-wrapper"]') ||
            document.querySelector(".admin-modal .react-search-autocomplete > div:last-child");

          if (!dropdownContainer) return;

          const selectedItem =
            dropdownContainer.querySelector('[aria-selected="true"]') ||
            dropdownContainer.querySelector(".selected") ||
            dropdownContainer.querySelector(":hover") ||
            dropdownContainer.querySelector("div:focus");

          if (selectedItem) {
            const containerRect = dropdownContainer.getBoundingClientRect();
            const itemRect = selectedItem.getBoundingClientRect();

            // Check if item is out of view
            if (itemRect.bottom > containerRect.bottom) {
              // Item is below visible area
              dropdownContainer.scrollTop += itemRect.bottom - containerRect.bottom + 10;
            } else if (itemRect.top < containerRect.top) {
              // Item is above visible area
              dropdownContainer.scrollTop -= containerRect.top - itemRect.top + 10;
            }
          }
        }, 50);
      }
    };

    const searchInput = searchRef.current?.querySelector("input");
    if (searchInput) {
      searchInput.addEventListener("keydown", handleKeyDown);
      return () => searchInput.removeEventListener("keydown", handleKeyDown);
    }
  }, []);

  // Set up dropdown interaction handlers
  useEffect(() => {
    const setupDropdownHandlers = () => {
      const dropdownContainer =
        document.querySelector('.admin-modal .react-search-autocomplete [data-test="results-wrapper"]') ||
        document.querySelector(".admin-modal .react-search-autocomplete > div:last-child");

      if (dropdownContainer) {
        dropdownRef.current = dropdownContainer;

        // Prevent dropdown from closing on scrollbar interaction
        dropdownContainer.addEventListener("mousedown", handleScrollbarInteraction, true);
        dropdownContainer.addEventListener("mouseup", handleScrollbarInteraction, true);
        dropdownContainer.addEventListener("click", handleScrollbarInteraction, true);

        // Add touch support
        dropdownContainer.addEventListener("touchstart", handleScrollbarInteraction, true);
        dropdownContainer.addEventListener("touchmove", handleScrollbarInteraction, true);
        dropdownContainer.addEventListener("touchend", handleScrollbarInteraction, true);

        // Style the dropdown for better interaction
        dropdownContainer.style.touchAction = "pan-y";
        dropdownContainer.style.overscrollBehavior = "contain";

        return () => {
          dropdownContainer.removeEventListener("mousedown", handleScrollbarInteraction, true);
          dropdownContainer.removeEventListener("mouseup", handleScrollbarInteraction, true);
          dropdownContainer.removeEventListener("click", handleScrollbarInteraction, true);
          dropdownContainer.removeEventListener("touchstart", handleScrollbarInteraction, true);
          dropdownContainer.removeEventListener("touchmove", handleScrollbarInteraction, true);
          dropdownContainer.removeEventListener("touchend", handleScrollbarInteraction, true);
        };
      }
    };

    // Set up handlers when dropdown appears
    const observer = new MutationObserver(() => {
      setupDropdownHandlers();
    });

    if (searchRef.current) {
      observer.observe(searchRef.current, { childList: true, subtree: true });
    }

    return () => {
      observer.disconnect();
    };
  }, [handleScrollbarInteraction]);

  return (
    <div ref={searchRef}>
      <ReactSearchAutocomplete
        items={dataList}
        onSelect={handleOnSelect}
        onHover={handleOnHover}
        onFocus={handleOnFocus}
        placeholder={placeholder}
        maxResults={10}
        showIcon={false}
        showClear={true}
        autoFocus={false}
        inputDebounce={100}
        styling={{
          borderRadius: "4px",
          backgroundColor: "white",
          border: "1px solid #ced4da",
          boxShadow: "0 0.125rem 0.25rem rgba(0, 0, 0, 0.075)",
          fontSize: "1rem",
          height: "38px",
          zIndex: 1050,
          searchIconMargin: "0 0 0 8px",
          clearIconMargin: "0 8px 0 0",
          hoverBackgroundColor: "#f8f9fa",
          color: "#495057",
          placeholderColor: "#6c757d",
          lineColor: "#ced4da",
          // Style the dropdown container
          resultsListBackgroundColor: "white",
          resultsListBorderColor: "#ced4da",
          resultsListMaxHeight: "300px",
        }}
      />
    </div>
  );
};

export default AutoCompleteSearch;
