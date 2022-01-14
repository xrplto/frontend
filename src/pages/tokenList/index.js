import React, { useEffect, useState } from 'react';
import axios from "axios";
import Table from "components/Table"



const Home = (props) => {
  const [ list, setList ] = useState([])
  const [ isloading, setIsloading ] = useState(true)
  useEffect(() => {
    axios.get("/api/tokens").then(({data}) => {
      setList(data)
      setIsloading(false)
    })
  }, [])
  return (
    <>
    <Table data={list} />
    </>
  )
}

export default Home