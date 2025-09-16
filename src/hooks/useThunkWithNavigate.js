import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom"


export const useThunkWithNavigate = (thunk) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  return (dispatch, getState) => thunk(dispatch, getState, navigate)
}