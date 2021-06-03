const OnlineIndicator = ({isOnline}) => {
  return (
    <div
      style={{
        width: "10px",
        height: "10px",
        marginLeft: "5px",
        borderRadius: "50%",
        border: "2px solid lightgrey",
        backgroundColor: isOnline ? "green" : "transparent"
      }}
    />
  )
}

export default OnlineIndicator;