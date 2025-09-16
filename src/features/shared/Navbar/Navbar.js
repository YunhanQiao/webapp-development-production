// import logo from "../images/sslogo_sm.png";
import logo from "../../../images/sslogo_sm.png";
const Navbar = () => {

  return (
    <header className="navbar-login" >
      <a id="sLink" className="skip-link" tabIndex="0">
        Skip to content
      </a>
      <button
        id="menuBtn"
        type="button"
        className="navbar-btn hidden"
        title="Menu"
        aria-controls="sideMenu"
        aria-label="Actions"
        aria-haspopup="true"
        aria-expanded="false"
        onClick={() => {}}
      >
        {/* <span id="menuBtnIcon" className="navbar-btn-icon fas fa-bars"></span> */}
        {/* <span id="menuBtnIcon" className="navbar-btn-icon fas">
        <FontAwesomeIcon icon={`${menuOpened ? 'times' : 'bars'}`} />
      </span> */}
      </button>
      <img
        src={logo}
        className="navbar-app-icon"
        alt="SpeedScore logo"
      />
      <h1 id="appName" className="navbar-title">
        SpeedScore
      </h1>

      {/* <!--THE SIDE MENU --> */}
    </header>
  );
};

export default Navbar;
