import {
  LOGOUT_SUCCESS,
  LOGIN_WITH_EMAIL_LOADING,
  LOGIN_WITH_EMAIL_SUCCESS,
  LOGIN_WITH_EMAIL_FAIL,
  LOGIN_WITH_OAUTH_LOADING,
  LOGIN_WITH_OAUTH_SUCCESS,
  LOGIN_WITH_OAUTH_FAIL,
  } from '../types';
  
  export default (state = {}, { type, payload }) => {
    switch (type) {     
      case LOGIN_WITH_EMAIL_LOADING:
      case LOGIN_WITH_OAUTH_LOADING:
        return {
          ...state,
          isLoading: true,
          error: null,
        };
      case LOGIN_WITH_EMAIL_SUCCESS:
      case LOGIN_WITH_OAUTH_SUCCESS:
        localStorage.setItem('token', payload.token);
        return {
          ...state,
          isAuthenticated: true,
          isLoading: false,
          token: payload.token,
          me: payload.me,
          error: null,
        };
      default:
        return state;
    }
  };
