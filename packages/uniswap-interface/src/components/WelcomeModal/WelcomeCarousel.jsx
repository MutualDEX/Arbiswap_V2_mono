import React, { useState, useRef, useEffect, useCallback } from 'react'
import Carousel from 'react-elastic-carousel'
import ImageSlide from './ImageSlide'
import L2 from '../../assets/gifs/l2.gif'
import TwitterImg from '../../assets/images/twitter_img.png'
import Withdraw from '../../assets/images/arrow-down-blue.svg'
import ActionsGif from '../../assets/gifs/uni.gif'
import Explorer from '../../assets/gifs/explorer.gif'

import TwitterImage from'../../assets/images/arrow-down-blue.svg'
import LogoHandshake from '../../assets/images/logo-handshake.png'

import { Link, EmphText } from '../../theme'
import TweetButton from './TweetButton'
import styled from 'styled-components'


const ModalLink = styled.a`
  color: ${({ theme }) => theme.primary1};

`
const TweetSpan = styled.span`
  * {
    display: inline;
    position: relative;
  }
`
function copyTextToClipboard(str) {
  console.warn('strsat', str);
  const el = document.createElement('textarea')
  el.value = str
  el.setAttribute('readonly', '')
  el.style.position = 'absolute'
  el.style.left = '-9999px'
  document.body.appendChild(el)
  el.select()
  document.execCommand('copy')
  document.body.removeChild(el)
}

const CopyLink = ({ url, msg }) => {

  const onClick = (e) => {
    e.preventDefault()
    copyTextToClipboard(url)
    alert(msg)
  }
  return (
    <ModalLink href="" onClick={onClick}>
      {url}
    </ModalLink>
  )
}

const carouselContainerStyle = {
  width: '95%',
  position: 'relative',
  height: '450px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-around'
}

const smallFontStyle = { fontSize: '15px', lineHeight: '20px' }

const noBorderImgStyle = { borderStyle: 'none' }

function WelcomeCarousel() {
  const carouselRef = useRef(null)
  const copyClick = (e)=>{
    e.preventDefault();

  }
  const [autoPlayEnabled, setAutoPlay] = useState(true)
  const disableAutoPlay = () => setAutoPlay(false)

  const handleArrowPress = useCallback(
    e => {
      e.stopPropagation()
      switch (e.keyCode) {
        case 37:
          carouselRef.current.slidePrev()
          disableAutoPlay()
          break
        case 39:
          carouselRef.current.slideNext()
          disableAutoPlay()
          break
        default:
          break
      }
    },
    [carouselRef]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleArrowPress)
    return () => {
      document.removeEventListener('keydown', handleArrowPress)
    }
  }, [handleArrowPress])

  const config = {
    enableAutoPlay: autoPlayEnabled,
    autoPlaySpeed: 70000,
    itmesToShow: 1
  }
  return (
    <Carousel
      onNextStart={disableAutoPlay}
      onPrevStart={disableAutoPlay}
      {...config}
      ref={carouselRef}
      style={carouselContainerStyle}
    >
      <ImageSlide
        text={
          <span>
            {' '}
            Welcome to Arbiswap, a layer 2 implementation of the Uniswap Exchange on Arbitrum Rollup, brought to you by
            the friendly folks at{' '}
            <ModalLink tModalLinkrget="_blank" href="https://offchainlabs.com/">
              {' '}
              Offchain Labs!
            </ModalLink>
            <br /> 
            <br />
            Once you get some funds on the rollup chain, you can use them just like you would Layer 1 Uniswap.
            <br />

            <br />
            Let's get started!
          </span>
        }
        imageUrl={LogoHandshake}
        imageStyle={noBorderImgStyle}
      />
      <ImageSlide
        text={
          <span>
            First, make sure you have{' '}
            <ModalLink target="_blank" href="https://metamask.io/download.html">
              MetaMask installed,
            </ModalLink>{' '}
            and then connect to our publically hosted node at <CopyLink  url="https://node.offchainlabs.com:8547" msg="Aggregator url copied to clipboard"/> via Custom RPC <ModalLink href="https://developer.offchainlabs.com/docs/Developer_Quickstart/" target="_blank">(or launch and connect to you own node!)</ModalLink>
          </span>
        }
        imageUrl={L2}
      />
      <ImageSlide
        text={
          <span>
            If you already have Ether/tokens on Kovan, you can deposit them via our <ModalLink href="https://bridge.offchainlabs.com/" target="_blank">token bridge.</ModalLink> <br/><br/>
            <span>Alternatively,</span> <TweetButton />{' '}
            <span> at us and we’ll send some Kovan ETH and Arbiswap test tokens directly to you on the Layer 2 chain.</span>
          </span>
        }
        imageUrl={TwitterImg}
        imageStyle={{minWidth: 225}}

      />
      <ImageSlide
        text={
          <span>
            Once you have funds in the Arbitrum Rollup chain, you can use them just like you would in Uniswap on Layer
            1: send, swap, add liquidity, etc.
          </span>
        }
        imageUrl={ActionsGif}
      />

      <ImageSlide
        text={
          <span>
            Check out our <ModalLink href="https://explorer.offchainlabs.com/#" target="_blank">block explorer</ModalLink> to see Arbitrum transactions get processed in real time. <br/><br/> As a bonus, if you add our custom block explorer url to MetaMask and MetaMask will link to your transactions directly:
             
             <CopyLink url="https://explorer.offchainlabs.com/#" msg="Block explorer url copied to clipboard" />
          </span>
        }
        imageUrl={Explorer}
        imageStyle={{maxHeight: 230}}
      />
      <ImageSlide
        text={
          <span>
            For more info, checkout our{' '}
            <ModalLink href="qq" target="_blank">
              blog
            </ModalLink>
            , our{' '}
            <ModalLink href="https://developer.offchainlabs.com/docs/Developer_Quickstart/" target="_blank">
              developer docs
            </ModalLink>
            , and the{' '}
            <ModalLink href="https://offchainlabs.com/" target="_blank">
              Offchain Labs website
            </ModalLink>
            .
            <br /> <br />
            Happy swapping!
          </span>
        }
        imageUrl={LogoHandshake}
        imageStyle={{ borderStyle: 'none', width: 250 }}
      />
    </Carousel>
  )
}

export default WelcomeCarousel
