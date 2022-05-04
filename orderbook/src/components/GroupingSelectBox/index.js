import React, { ChangeEvent, FunctionComponent } from 'react';

import { Container } from "./Container";
import { useSelector, useDispatch } from "react-redux";
import { selectGrouping, setGrouping } from "../OrderBook/orderbookSlice";

export const GroupingSelectBox = ({options}) => {
  const groupingSize = useSelector(selectGrouping);
  const dispatch = useDispatch();

  const handleChange = (event) => {
    dispatch(setGrouping(Number(event.target.value)));
  };

  return (
    <Container>
      <select data-testid="groupings" name="groupings" onChange={handleChange} defaultValue={groupingSize}>
        {options.map((option, idx) => <option key={idx} value={option}>Group {option}</option>)}
      </select>

    </Container>
  );
};

export default GroupingSelectBox;
