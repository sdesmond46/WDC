$(document).ready(function() {
  // Get the login link from the shared javascript library
  $('#loginLink').attr('href', _getFacebookAuthUrl());

  // Set the access token if we have one and redirect over to the actual WDC page
  var accessToken = _getAccessTokenFromQueryString();
  if (!!accessToken) {
    Cookies.set(ACCESS_TOKEN_COOKIE_NAME, accessToken);
    window.location = "./";
  } else {
  	// If we don't have an access token, redirect the user to sign in to facebook
  	window.location = _getFacebookAuthUrl();
  }
});