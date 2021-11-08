import {
    CHANGE_THEME
} from '../types';

const initial_state = {
    theme: true
}
export default (state = initial_state, action) => {
  switch (action.type) {     
    case CHANGE_THEME: 
        return {...state, theme: action.payload}
    default:
      return state;
  }
};