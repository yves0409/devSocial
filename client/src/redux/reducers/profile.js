import {
  GET_PROFILE,
  PROFILE_ERROR,
  CLEAR_PROFILE,
  UPDATE_PROFILE,
  GET_PROFILES,
  GET_REPOS,
  //NO_REPOS
} from "../actions/types";

const initialState = {
  profile: null,
  profiles: [],
  repos: [],
  loading: true,
  error: {},
};

export default function (state = initialState, action) {
  const { type, payload } = action;

  switch (type) {
    case GET_PROFILE:
    case UPDATE_PROFILE:
      return {
        ...state,
        profile: payload, //fill the profile array from the initialstate with the payload
        loading: false,
      };
    case GET_PROFILES:
      return {
        ...state,
        profiles: payload, //fill the profiles array from the initialstate with the payload
        loading: false,
      };
    case PROFILE_ERROR:
      return {
        ...state,
        error: payload,
        loading: false,
        profile: null,
      };
    case CLEAR_PROFILE:
      return {
        ...state,
        profile: null, //clear the initialstate
        repos: [], //clear the initialstate
        loading: false, //clear the initialstate
      };
    case GET_REPOS:
      return {
        ...state,
        repos: payload, //fill the repos array from the initialstate with the payload
        loading: false,
      };
    default:
      return state;
  }
}
