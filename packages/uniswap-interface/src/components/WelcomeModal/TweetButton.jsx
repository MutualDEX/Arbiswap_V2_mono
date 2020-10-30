import React from 'react'
import styled from 'styled-components'
import useTwitter  from '../../hooks/useTwitter'

const TweetLink = styled.a`
  position: relative;
  box-sizing: border-box;
  padding: 1px 8px 1px 6px;
  background-color: #1b95e0;
  color: #fff;
  border-radius: 3px;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  font-family: Helvetica;
`
const TweetButton = () => {
  const handleClick = useTwitter()
  return (
    <TweetLink target="_blank" onClick={handleClick}>
      Click here to Tweet
    </TweetLink>
  )
}

export default TweetButton
