// user.model.js

export default class User {
  constructor(userObject) {
    this.accountInfo = {
      email: userObject?.email || null,
      password: userObject?.password || null,
      securityQuestion: null,
      securityAnswer: null,
    };
    this.personalInfo = {
      // displayName: userObject?.displayName || null,
      profilePic: userObject?.profilePic || null,
      firstName: userObject?.firstName || null,
      lastName: userObject?.lastName || null,
      birthdate: userObject?.dateOfBirth || null,
      parGender: userObject?.parPreference || null,
      hometown: userObject?.hometown || null,
      homeState: userObject?.state || null,
      homeCountry: userObject?.country || null,
    };
    this.speedgolfInfo = {
      bio: "",
      homeCourse: "",
      firstRound: "",
      clubs: {},
      clubNotes: "",
    };
    this.rounds = [];
    this.currentBuddies = [];
    this.incomingBuddyRequests = [];
    this.outgoingBuddyRequests = [];
    // add last login device
    // this.roundCount = 0;
    // this.privacyInfo = {
    //   isSensitiveInfoPublic: {
    //     birthdate: userObject?.isSensitiveInfoPublic?.birthdate || false,
    //     location: userObject?.isSensitiveInfoPublic?.location || false,
    //     name: userObject?.isSensitiveInfoPublic?.name || false,
    //     parGender: userObject?.isSensitiveInfoPublic?.parGender || false,
    //     speedgolfInfo: userObject?.isSensitiveInfoPublic?.speedgolfInfo || false,
    //     rounds: userObject?.isPublicInfoChange?.rounds || false,
    //     stats: userObject?.isPublicInfoChange?.stats || false,
    //     posts: userObject?.isPublicInfoChange?.posts || false
    //   },
    //   preferredUnit: "Imperial"
    // };
  }

  setPreferences = userObject => {
    this.preferences = {
      parGenderIsPrivate: false,
      homeLocationIsPrivate: false,
      birthdateIsPrivate: false,
      speedgolfInfoIsPrivate: false,
      speedgolfRoundsArePublic: false,
      speedgolfStatsArePublic: false,
      feedPostsArePublic: false,
      preferredUnits: "imperial",
    };
  };
}
