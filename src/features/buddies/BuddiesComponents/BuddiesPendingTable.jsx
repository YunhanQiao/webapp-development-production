import React, { useEffect } from "react";
import BuddiesCardOutgoingRequest from "./BuddiesCardOutgoingRequest";
import BuddiesCardIncomingRequest from "./BuddiesCardIncomingRequest";
import { useDispatch, useSelector } from "react-redux";
import { fetchOutgoingBuddyRequests } from "../buddiesActions";
import DefaultProfilePic from "../../../images/DefaultProfilePic.jpg";

// Pending Buddies Table
function BuddiesPendingTable({ incomingRequests, outgoingRequests, onCardClick }) {
  //   const userState = useSelector(state => state.user);
  //   const user = userState.user;
  //   const dispatch = useDispatch();
  //   // let userAuthenticated = user?.accountInfo?.authenticated || false;
  //   let userAuthenticated = userState.authenticated;
  //   const userId = user._id;
  //   const jwtToken = userState.tokens.jwtToken;
  //   useEffect(() => {
  //     if (jwtToken && userId) {
  //         console.log("BuddiesPendingTable useEffect - Fetching Outgoing Buddy Requests");
  //         dispatch(fetchOutgoingBuddyRequests(jwtToken, userId));
  //     }
  // }, [dispatch, jwtToken, userId]);
  // return (
  //   <div>
  //     <h2 className='pb-2' style={{ fontSize: '34px' }}>
  //       Pending Requests
  //     </h2>

  //     {/* Incoming Buddy Requests */}
  //     <div className='thin-blue-border'>
  //     <h3> Incoming Buddy Requests </h3>
  //     <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "flex-start", gap: "20px", marginBottom: "20px" }}>
  //       {incomingRequests && incomingRequests.length > 0 ? (
  //         incomingRequests.map(buddy => (
  //           <BuddiesCardIncomingRequest
  //             key={buddy._id}
  //             buddy={{
  //               _id: buddy._id,
  //               firstName: buddy.firstName,
  //               lastName: buddy.lastName,
  //               profilePic: buddy.profilePic

  //             }}
  //             onClick={() => onCardClick(buddy._id)} // Change 'onclick' to 'onClick'

  //           />
  //         ))
  //       ) : (
  //         <p style={{ color: "#ff0f00" }}>No incoming requests to display.</p>
  //       )}
  //     </div>

  //     {/* Outgoing Buddy Requests */}
  //     <h3 className= 'pb-2'> Outgoing Buddy Requests </h3>
  //     <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "flex-start", gap: "20px", marginBottom: "20px" }}>
  //       {outgoingRequests && outgoingRequests.length > 0 ? (
  //         outgoingRequests.map(buddy => (
  //           <BuddiesCardOutgoingRequest
  //             key={buddy._id}
  //             buddy={{
  //               _id: buddy._id,
  //               firstName: buddy.firstName,
  //               lastName: buddy.lastName,
  //               profilePic: buddy.profilePic
  //             }}
  //             onClick={() => onCardClick(buddy._id)} // Change 'onclick' to 'onClick'
  //           />
  //         ))
  //       ) : (
  //         <p style={{ color: "#ff0f00" }}>No outgoing requests to display.</p>
  //       )}
  //     </div>
  //   </div>
  //   </div>
  // );

  return (
    <div className="container mb-5">
      {/* <h2 className='pb-2' style={{ fontSize: '28px', fontWeight: '600', color: '#333' }}>
        Pending Requests
      </h2> */}
      <h2 className="current-buddies-banner">Pending Requests </h2>

      {/* Incoming Buddy Requests */}
      <div className="mb-4">
        {/* <h3 style={{ fontSize: '24px', fontWeight: '500', color: '#555' }}>Incoming Buddy Requests</h3> */}
        <h3 className="sub-heading-banner mb-2">Incoming Buddy Requests</h3>
        <div className="card-deck d-flex flex-wrap justify-content-center gap-3 mt-3">
          {incomingRequests && incomingRequests.length > 0 ? (
            incomingRequests.map(buddy => (
              <BuddiesCardIncomingRequest
                key={buddy._id}
                buddy={{
                  _id: buddy._id,
                  firstName: buddy.firstName,
                  lastName: buddy.lastName,
                  profilePic: buddy.profilePic,
                }}
                onProfilePicClick={() => onCardClick(buddy._id)} // Trigger modal when profile pic is clicked
              />
            ))
          ) : (
            <p style={{ color: "#ff0f00", fontWeight: "500", marginTop: "20px" }}>No incoming requests to display.</p>
          )}
        </div>
      </div>

      {/* Outgoing Buddy Requests */}
      <div className="mb-4">
        {/* <h3 style={{ fontSize: "24px", fontWeight: "500", color: "#555" }}>Outgoing Buddy Requests</h3> */}
        <h3 className="sub-heading-banner mb-2 mt-5">Outgoing Buddy Requests</h3>
        <div className="card-deck d-flex flex-wrap justify-content-center gap-3 mt-3">
          {outgoingRequests && outgoingRequests.length > 0 ? (
            outgoingRequests.map(buddy => (
              <BuddiesCardOutgoingRequest
                key={buddy._id}
                buddy={{
                  _id: buddy._id,
                  firstName: buddy.firstName,
                  lastName: buddy.lastName,
                  profilePic: buddy.profilePic,
                }}
                onProfilePicClick={() => onCardClick(buddy._id)} // Trigger modal when profile pic is clicked
              />
            ))
          ) : (
            <p style={{ color: "#ff0f00", fontWeight: "500", marginTop: "20px" }}>No outgoing requests to display.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default BuddiesPendingTable;
