// =====================================================================
// config.js — Verkko- ja palvelinkonfiguraatio
// Käytetään: index.html (ristinolla, online-moninpeli)
// Ladataan <script src="config.js"> ENNEN grid-game.js:ää
//
// VÄLIAIKAINEN: ICE_CONFIG poistuu Firebase-siirtymässä (M001 → v2).
// ExpressTURN-tunnukset ovat ilmaistason — repo on yksityinen.
// =====================================================================

const ICE_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    {
      urls: 'turn:free.expressturn.com:3478',
      username: '000000002089396090',
      credential: 'dyudkJmiYun8vQDCOFNZShZpA7Q=',
    },
  ],
};
