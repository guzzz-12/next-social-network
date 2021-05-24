import {useState, useRef} from "react";
import Router from "next/router";
import {List, Item, Search} from "semantic-ui-react";
import axios from "axios";
import jsCookie from "js-cookie";

const SearchComponent = () => {
  const timeoutRef = useRef();
  
  const [term, setTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  const searchUsers = async (term) => {
    setLoading(true);

    try {
      const res = await axios({
        method: "GET",
        url: `/api/search/${term}`,
        withCredentials: true
      });

      // console.log({searchResults: res.data});
      setLoading(false);
      setResults(res.data.data);
      
    } catch (error) {
      let message = error.message;

      if(error.response) {
        message = error.response.data.message;
      }

      console.log({searchError: message});
      setError(message);
      setLoading(false);
    }
  }

  const onSearchChangeHandler = (e) => {
    setTerm(e.target.value);

    // Resetear el timeout anterior si se tipea de nuevo antes de que termine
    if(timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Ejecutar el request para chequear el username sólo
    // si se deja de tipear durante el tiempo especificado
    timeoutRef.current = setTimeout(() => {
      searchUsers(e.target.value);
    }, 500);
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
            <Item.Header style={{fontSize: "18px"}} as="a">
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
      value={term}
      onSearchChange={onSearchChangeHandler}
      resultRenderer={(props) => <ResultsRenderer {...props} />}
      results={results}
      minCharacters={3}
      onResultSelect={(e, data) => Router.push(`/user/${data.result.username}`)}
    />
  )
}

export default SearchComponent;
