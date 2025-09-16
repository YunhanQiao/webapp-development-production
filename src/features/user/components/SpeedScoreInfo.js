// src/features/landing/SpeedScoreInfo.js
import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../../shared/Navbar/Navbar";
import sslogos from "../../../images/Speedgolf_Technology-FF-01.png";

const SpeedScoreInfo = () => {
  return (
    <>
      <Navbar />
      <br />
      <div className='container mt-5'>
        <h1>Welcome to the Future of Speedgolf</h1>
        <p>
          SpeedScore is the world's first and only app ecosystem for speedgolf. It brings together an international community of folks
          who are passionate about playing, tracking, competing in, analyzing, following and discussing a modern version
          of golf where strokes and minutes count equally.
        </p>
        <section className='features'>
          <p>In the SpeedScore web app, you can:</p>
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
        </section>
        <section className='cta'>
          <h3 className='cta-heading'>Get Started Today! Speedgolf Baby, let's go!</h3>
          <h6>
            <a target="blank" href={`${process.env.REACT_APP_TUTORIAL_VIDEOS_URL}`}>Need help? Access video tutorials - (Opens new window)</a>
          </h6>
          <div className='image-row d-flex align-items-center'>
          <img src={sslogos} alt='speedScore Logo' className='me-2' style={{ height: '200px', width: '400px' }} />
          </div>
        </section>
        <Link to='/login' 
        className='btn btn-primary btn-sm fm-primary-btn mt-3' 
        style={{ fontSize: '16px', padding: '10px 10px', height: 'auto', lineHeight: '1.2' }} >
          Back to Login
        </Link>
      </div>
    </>
  );
};

export default SpeedScoreInfo;
