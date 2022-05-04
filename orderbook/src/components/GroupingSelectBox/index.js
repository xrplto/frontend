import React, { ChangeEvent, FunctionComponent } from 'react';

import { useSelector, useDispatch } from "react-redux";
import { selectGrouping, setGrouping } from "../OrderBook/orderbookSlice";

import styled from "styled-components";

const Container = styled.div`
  select {
    border-radius: 3px;
    padding: 0.3em;
    color: white;
    border: none;
    background-color: #303947;
    
    &:hover {
      cursor: pointer;
    }
  }
`
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
