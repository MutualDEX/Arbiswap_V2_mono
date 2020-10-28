import React from 'react'
import styled from 'styled-components'
import { useDarkModeManager } from '../../state/user/hooks'
import Row, { RowBetween } from '../Row'

const HeaderFrame = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-direction: column;
  width: 100%;
  bottom: 8px;
  position: absolute;
  z-index: 0;
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    padding: 12px 0 0 0;
    width: calc(100%);
    position: relative;
  `};
`

const HeaderElement = styled.div`
  display: flex;
  align-items: center;
`


const Title = styled.a`
  display: flex;
  align-items: center;
  pointer-events: auto;
  text-decoration: none;  
  opacity: 0.5;
  font-style: normal;
  :hover {
    cursor: pointer;
  }
`

const TitleText = styled(Row)`
  width: fit-content;
  white-space: nowrap;
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    display: none;
  `};
`
interface Props {
    isDark: boolean
}
const FooterLink = styled.a`
  color: ${ (props:Props) => props.isDark ? "white" : "black"};
`

export default function Header() {
  const [isDark] = useDarkModeManager()
    
  
  return (
    <HeaderFrame>
      <RowBetween style={{ alignItems: 'flex-start' }} padding="1rem 1rem 0 1rem">
        <HeaderElement>
          <Title href="." style={{color: isDark ? "white" : "black"}}>
            <TitleText>
              <span>An L2 <FooterLink target="_blank" isDark={isDark} href="https://uniswap.org/">Uniswap </FooterLink> fork by {' '}
              <FooterLink target="_blank" isDark={isDark} href="https://offchainlabs.com/">Offchain Labs</FooterLink></span>
            </TitleText>
          </Title>
        </HeaderElement>
      </RowBetween>
    </HeaderFrame>
  )
}
