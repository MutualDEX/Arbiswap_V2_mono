import React from 'react'
import styled from 'styled-components'
import { useActiveWeb3React } from '../../hooks'

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
  const { account } = useActiveWeb3React()
  const text = `@Arbi_Swap hey @OffchainLabs, gimme some Ropsten test tokens plz! ${account || '0xyouraddresshere'}`
    .split(' ')
    .join('%20')
  const handleClick = () => {
    window.open('https://twi' + `tter.com/intent/tweet?text=${text}`)
  }
  return (
    <TweetLink target="_blank" onClick={handleClick}>
      Click here to Tweet
    </TweetLink>
  )
}

export default TweetButton
