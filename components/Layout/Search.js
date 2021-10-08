import {useState, useRef} from "react";
import Router from "next/router";
import {Item, Search} from "semantic-ui-react";
import axios from "axios";

// Token de cancelación de requests de axios
const CancelToken = axios.CancelToken;

const SearchComponent = ({type, onClickHandler}) => {
  const cancellerRef = useRef();
  
  const [term, setTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  const searchUsers = async (term) => {
    setLoading(true);
    setResults([]);

    // Cancelar el request anterior en caso de repetirlo
    cancellerRef.current && cancellerRef.current();

    try {
      const res = await axios({
        method: "GET",
        url: `/api/search/${term}`,
        cancelToken: new CancelToken((canceller) => {
          cancellerRef.current = canceller
        })
      });

      // console.log({searchResults: res.data});
      setLoading(false);
      setResults(res.data.data);
      
    } catch (error) {
      let message = error.message;

      if(error.response) {
        message = error.response.data.message;
      }
      setError(message);
      setLoading(false);
    }
  }

  const onSearchChangeHandler = (e) => {
    setTerm(e.target.value);
    searchUsers(e.target.value);
  }

  const ResultsRenderer = ({_id, avatar, name, username}) => {
    return (
      <Item.Group key={_id} divided>
        <Item>
          <Item.Image
            style={{
              display: "block",
              width: "45px",
              height: "45px",
              objectFit: "cover",
              objectPosition: "center center",
              borderRadius: "100%"
            }}
            src={avatar}
            alt={`${name} avatar`}
          />
          <Item.Content verticalAlign="middle">
            <Item.Header
              style={{fontSize: "18px"}}
              as={type === "chat" ? "p" : "a"}
            >
              @{username}
            </Item.Header>
          </Item.Content>
        </Item>
      </Item.Group>
    )
  }

  return (
    <Search
      onBlur={() => setResults([])}
      loading={loading}
      placeholder="Search user"
      value={term}
      onSearchChange={onSearchChangeHandler}
      resultRenderer={(props) => <ResultsRenderer {...props} />}
      results={results}
      minCharacters={1}
      onResultSelect={(e, data) => {
        if(type === "chat") {
          const clickedUserId = data.result._id;
          onClickHandler(clickedUserId);
          setTerm("");
        } else {
          Router.push(`/user/${data.result.username}`)
        }
      }}
    />
  )
}

export default SearchComponent;
