import React from "react";
import ReactDOM from "react-dom/client";
import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min";
import "./styles/style.css";
import "./styles/components/modals.css";
import "./styles/mapbox-accessibility-override.css";
import CoursesMode from "./features/course/components/CoursesMode";
import App from "./App";
import { library } from "@fortawesome/fontawesome-svg-core";
import {
  faPlus,
  faMapPin,
  faGlobe,
  faMap,
  faPhone,
  faEye,
  faCamera,
  faXmark,
  faCircleXmark,
  faEdit,
  faSave,
  faStar,
  faCheck,
  faCircleInfo,
  faArrowPointer,
  faChartLine,
  faBars,
  faSearch,
  faTimes,
  faChevronDown,
  faChevronRight,
  faTrash,
  faSortUp,
  faSortDown,
  faSort,
} from "@fortawesome/free-solid-svg-icons";
import UserContextProvider from "./components/contexts/UserContext";
import RoundsContextProvider from "./components/contexts/RoundsContext";
import { ToastContainer } from "react-toastify";
import AppContextProvider from "./components/contexts/AppContext";
import { Provider } from "react-redux";
import store from "./app/configureStore";
import LoadingOverlay from "./features/loader";
import SupportButton from "features/supportTicket";
library.add(faPlus);
library.add(faMapPin);
library.add(faGlobe);
library.add(faMap);
library.add(faPhone);
library.add(faEye);
library.add(faCamera);
library.add(faXmark);
library.add(faCircleXmark);
library.add(faEdit);
library.add(faSave);
library.add(faStar);
library.add(faCheck);
library.add(faCircleInfo);
library.add(faArrowPointer);
library.add(faChartLine);
library.add(faBars);
library.add(faSearch);
library.add(faTimes);
library.add(faChevronDown);
library.add(faChevronRight);
library.add(faTrash);
library.add(faSortUp);
library.add(faSortDown);
library.add(faSort);

const rootDiv = ReactDOM.createRoot(document.getElementById("root"));

rootDiv.render(
  // <React.StrictMode>
  <Provider store={store}>
    {/* <AppContextProvider> */}
    {/* <UserContextProvider> */}
    {/* <RoundsContextProvider> */}
    <ToastContainer />
    <LoadingOverlay />
    <App />
    <SupportButton />
    {/* </RoundsContextProvider> */}
    {/* </UserContextProvider> */}
    {/* </AppContextProvider> */}
  </Provider>,
  // </React.StrictMode>
);

// // If you want to start measuring performance in your app, pass a function
// // to log results (for example: reportWebVitals(console.log))
// // or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();
