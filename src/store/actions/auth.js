import axios from "axios";

import {
    LOGOUT_SUCCESS,
    LOGIN_WITH_EMAIL_LOADING,
    LOGIN_WITH_EMAIL_SUCCESS,
    LOGIN_WITH_EMAIL_FAIL,
    LOGIN_WITH_OAUTH_LOADING,
    LOGIN_WITH_OAUTH_SUCCESS,
    LOGIN_WITH_OAUTH_FAIL,
} from '../types';

const BaseUrl = process.env.REACT_APP_BACKEND_URL


export const loginUserWithEmail = async (dispatch, history, formData) => {
    dispatch({ type: LOGIN_WITH_EMAIL_LOADING });
    try {
      const response = await axios.post(`${BaseUrl}/auth/login`, formData);
  
      dispatch({
        type: LOGIN_WITH_EMAIL_SUCCESS,
        payload: { token: response.data.token, me: response.data.me },
      });  
      history.push('/');
    } catch (err) {
      dispatch({
        type: LOGIN_WITH_EMAIL_FAIL,
        payload: { error: err.response.data.message },
      });
    }
  };