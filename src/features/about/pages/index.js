import { useEffect, useRef } from "react";
// import { useAppContext } from "../../../components/contexts/AppContext";
import { useDispatch } from "react-redux";
import { disableShowPane } from "../aboutSlice";
import { useSelector } from "react-redux";
import { Modal } from "bootstrap";
// import './AboutStyles.css';

const About = () => {
  // const { showAboutPane, setShowAboutPane } = useAppContext();
  const modalRef = useRef();
  const modalInstance = useRef();
  const dispatch = useDispatch();
  const showAboutPane = useSelector(state => state.about.showPane);

  useEffect(() => {
    modalInstance.current = new Modal(modalRef.current);
  }, []);

  useEffect(() => {
    if (showAboutPane) {
      modalInstance.current.show();
    } else {
      modalInstance.current.hide();
    }
  }, [showAboutPane]);

  return (
    // <!-- ABOUT BOX -->
    <div
      className="modal fade"
      data-bs-backdrop="static"
      ref={modalRef}
      tabIndex="-1"
      id="aboutSpeedScore"
      role="dialog"
      aria-hidden="true"
    >
      <div className="modal-dialog modal-lg">
        {/* <!-- Modal content--> */}
        <div className="modal-content" style={{ background: "#fff" }}>
          <div className="modal-header">
            <center>
              <p className="modal-title">
                <b>About SpeedScore</b>
              </p>
            </center>
            <button type="button" className="close-about-btn" onClick={() => dispatch(disableShowPane(false))}>
              &times;
            </button>
          </div>
          <div className="modal-body">
            <center>
              <img
                src="https://dl.dropboxusercontent.com/s/awuwr1vpuw1lkyl/SpeedScore4SplashLogo.png"
                height="200"
                width="200"
                alt="SpeedScore Logo"
              />
              <h3>The World's First and Only App for Speedgolf</h3>
              <p style={{ fontStyle: "italic" }}>
                Version S, Build 08.05.2024
                <br />
                &copy; 2017-24 The Professor of Speedgolf. All rights reserved.
              </p>
            </center>
            <p>
              SpeedScore is the world's first and only app ecosystem for speedgolf. It brings together an international
              community of folks who are passionate about playing, tracking, competing in, analyzing, following and
              discussing a modern version of golf where strokes and minutes count equally.
            </p>
            <p>The SpeedScore app supports</p>
            <ul>
              <li>Connect with players and followers of speedgolf from around the world.</li>
              <li>Discover speedgolf-friendly courses in SpeedScore's speedgolf-specific course database.</li>
              <li>
                Create and utilize detailed speedgolf maps of golf courses that use running paths and elevation profiles
                to compute principled hole-by-hole time pars.
              </li>
              <li>Log and analyze speedgolf rounds using SpeedScore's exclusive speedgolf-specific course data.</li>
              <li>Discover and register for speedgolf tournaments around the world.</li>
              <li>Create and participate in speedgolf leagues, both in person and virtual.</li>
              <li>Challenge speedgolfers to matches that can be played at different times and on different courses.</li>
            </ul>
            <p>
              SpeedScore was first developed by Dr. Chris Hundhausen, professor computer science at Oregon State
              University and the <i>Professor of Speedgolf</i>, with support from Scott Dawley, CEO of Speedgolf USA,
              LLC. It is now under active development by Oregon State University's Speedgolf Technology and Analytics
              Lab (STAL).
            </p>

            <p>
              For more information on SpeedScore, visit{" "}
              <a
                className="about-link"
                href="https://research.engr.oregonstate.edu/stal/"
                target="_blank"
                rel="noreferrer"
              >
                OSU's Speedgolf Technology and Analytics Lab
              </a>
              . For more information on speedgolf, visit{" "}
              <a className="about-link" href="http://playspeedgolf.com" target="_blank" rel="noreferrer">
                playspeedgolf.com
              </a>{" "}
              and{" "}
              <a className="about-link" href="http://speedgolfusa.com" target="_blank" rel="noreferrer">
                Speedgolf USA
              </a>
              .
            </p>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn close-about-btn" onClick={() => dispatch(disableShowPane(false))}>
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
