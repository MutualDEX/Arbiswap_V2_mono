import React from 'react'
import styled from 'styled-components'

const WelcomeImg = styled.img`
  width: 160px;
  height: auto;
  border: 2px solid #dc6be5;
  border-radius: 5px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
  width: 160px;
  height: auto;

   `}
  ${({ theme }) => theme.mediaWidth.upToSmall`
   width: 115px;
   height: auto;

 `}
`

const ImgWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 10px;
`

const WelcomeText = styled.div`
  font-size: 16px;
  margin-bottom: 10px;
  min-height: 100px;
  line-height: 24px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
`}
`
const WelcomeSliderContainer = styled.div`
  display: flex;
  flex-direction: column;
`

function ImageSlide({ text, imageUrl, imageStyle = {}, textStyle = {} }) {
  return (
    <WelcomeSliderContainer>
      <WelcomeText style={textStyle}> {text}</WelcomeText>
      <ImgWrapper>
        <WelcomeImg src={imageUrl} style={imageStyle} />
      </ImgWrapper>
    </WelcomeSliderContainer>
  )
}

export default ImageSlide
