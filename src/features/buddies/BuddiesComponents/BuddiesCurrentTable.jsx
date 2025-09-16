import React from "react";
import BuddiesCurrentCard from "./BuddiesCurrentCard";

function BuddiesCurrentTable({ currentBuddies, onCardClick }) {
  // return (
  //   <div>
  //     <h2 className='pb-2' style={{ fontSize: '34px' }}>
  //       Current Buddies
  //     </h2>
  //     <div className='thin-blue-border'>
  //     <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "flex-start", gap: "20px" }}>
  //       {currentBuddies.length > 0 ? (
  //         currentBuddies.map(buddy => (
  //           <BuddiesCurrentCard
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
  //         <p style={{ color: "#ff0f00" }}>No Buddies to Display. Try searching above!</p>
  //       )}
  //     </div>
  //   </div>
  //   </div>
  // );

  return (
    <div className="container mb-5">
      {/* <h2 className='pb-2' style={{ fontSize: '28px', fontWeight: '600', color: '#333' }}>
        Current Buddies
      </h2> */}
      <h2 className="current-buddies-banner">Current Buddies</h2>

      <div className="card-deck d-flex flex-wrap justify-content-center gap-3">
        {currentBuddies.length > 0 ? (
          currentBuddies.map(buddy => (
            <BuddiesCurrentCard
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
          <p style={{ color: "#ff0f00", fontWeight: "500", marginTop: "20px" }}>
            No Buddies to Display. Try searching above!
          </p>
        )}
      </div>
    </div>
  );
}

export default BuddiesCurrentTable;
