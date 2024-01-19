import React from "react";
import styles from "../styles/Loading.module.scss";
import Spinner from "react-bootstrap/Spinner";

const Loading: React.FC<{}> = ({}) => {
  return <Spinner animation="grow" variant="info" size="sm"/>;
};

export default Loading;
