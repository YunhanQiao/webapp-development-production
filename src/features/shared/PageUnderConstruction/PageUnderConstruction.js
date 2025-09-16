// import bigLogo from "../images/sslogo_lg.png";
import bigLogo from "../../../images/sslogo_lg.png";

const PageUnderConstruction = (props) => {
  return (
    <>
      <h1 className="mode-page-header">{props.heading}</h1>
      <p className="mode-page-content">This page is under construction.</p>
      <img
        className="mode-page-icon"
        src={bigLogo}
        alt="SpeedScore logo"
      />{" "}
    </>
  );
};

export default PageUnderConstruction;
