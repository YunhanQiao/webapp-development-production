import ssLogo from "../images/sslogo2.png";

function Header({cName, text}) {
    return <h1 className={cName}>{text}</h1>
}

function Content({cName, text}) {
    return <p className={cName}>{text}</p>
}

function Graphic({cName, source, alt}) {
    return <img className={cName} source={source} alt={alt}/>
}

function Button({icon, bClass, bId, label}) {
    return <button className={bClass} id={bId}><i className={icon}></i>&nbsp;{label}</button>
}

const coursesDiv = ReactDOM.createRoot(document.getElementById('coursesModeTab'));
coursesDiv.render(
    <>
    <Header cName="mode-page-header" text="Courses" />
    <Content cName="mode-page-content" text="This page is under construction" />
    <Graphic cName="mode-page-icon" source={ssLogo} alt="SpeedScore logo"/>
    <Button icon="fas fa-plus fa-fw" bClass="float-btn" bId="coursesModeActionBtn" label="New Course" />
    </>
);