import Page from '../../components/Page';
import * as React from 'react';
import { alpha, styled } from '@mui/material/styles';
import { AppBar } from '@mui/material';

function useAsyncHook(searchBook) {
  const [result, setResult] = React.useState([]);
  const [loading, setLoading] = React.useState("false");

  React.useEffect(() => {
    async function fetchBookList() {
      try {
        setLoading("true");
        const response = await fetch(
          `https://www.googleapis.com/books/v1/volumes?q=${searchBook}`
        );

        const json = await response.json();
        // console.log(json);
        setResult(
          json.items.map(item => {
            console.log(item.volumeInfo.title);
            return item.volumeInfo.title;
          })
        );
      } catch (error) {
        setLoading("null");
      }
    }

    if (searchBook !== "") {
      fetchBookList();
    }
  }, [searchBook]);

  return [result, loading];
}

const RootStyle = styled(AppBar)(({ theme }) => ({
    boxShadow: 'none',
    backdropFilter: 'blur(2px)',
    WebkitBackdropFilter: 'blur(2px)', // Fix on Mobile
    backgroundColor: alpha("#000", 0.2),
    width: '100%', /* Full width */
    height:'100%' /* Full height */
}));

export default function TestReact() {
    const [search, setSearch] = React.useState("");
    const [query, setQuery] = React.useState("");
    const [result, loading] = useAsyncHook(query);
    return (
        <Page title="Test Page">
            <RootStyle/>
            <div className="App">
            <h2>Search for Books</h2>
            <form
                onSubmit={e => {
                    e.preventDefault();
                    setQuery(search);
                }}
            >
                <label>Search : </label>
                <input type="text" onChange={e => setSearch(e.target.value)} />
                <input type="submit" value="search" />
            </form>

            {loading === "false" ? (
                <h3>...</h3>
            ) : loading === "null" ? (
                <h3>No Book Found</h3>
            ) : (
                result.map(item => {
                    return <p>Title : {item}</p>;
                })
            )}
            </div>
        </Page>
      );
}