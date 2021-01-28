import React, { useState, useRef, useEffect, useCallback } from 'react'
import Carousel from 'react-elastic-carousel'
import ImageSlide from './ImageSlide'
import L2 from '../../assets/gifs/l2.gif'
import TwitterImg from '../../assets/images/twitter_img.png'
import Withdraw from '../../assets/images/arrow-down-blue.svg'
import ActionsGif from '../../assets/gifs/uni.gif'
import Explorer from '../../assets/gifs/explorer.gif'
import Portis from '../../assets/gifs/portis.gif'

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

function WelcomeCarousel( { closeModal }) {
  const carouselRef = useRef(null)
  const [autoPlayEnabled, setAutoPlay] = useState(true)
  const disableAutoPlay = () => setAutoPlay(false)

  const CopyLink = ({ url, msg }) => {

    const onClick = (e) => {
      e.preventDefault()
      closeModal()
      setTimeout(()=>{
        copyTextToClipboard(url)
        alert(msg)
      }, 300)

    }
    return (
      <ModalLink href={url} onClick={onClick}>
        {url}
      </ModalLink>
    )
  }
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
            Welcome to Arbiswap, a layer 2 implementation of the  <ModalLink target="_blank" href="https://uniswap.org/">Uniswap Exchange</ModalLink> on Arbitrum Rollup, brought to you by
            the friendly folks at{' '}
            <ModalLink target="_blank" href="https://offchainlabs.com/">
              {' '}
              Offchain Labs!
            </ModalLink>
            <br /> 
            <br />
            Once you get some funds on the rollup chain, you can use them with the Portis, Fortmatic or MetaMask wallets, just like you would Layer 1 Uniswap.
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
          <span style={{fontSize: '14px'}}>
            To use MetaMask, first make sure you have the extension{' '}
            <ModalLink target="_blank" href="https://metamask.io/download.html">
              installed,
            </ModalLink>{' '}
            and then connect to our publicly hosted node at <CopyLink  url="https://kovan3.arbitrum.io/rpc" msg="Aggregator url copied to clipboard"/> (click to copy) with chain id <CopyLink  url="79377087078960" msg="Chain ID copied to clipboard"/> via Custom RPC <ModalLink href="https://developer.offchainlabs.com/docs/Developer_Quickstart/" target="_blank">(or launch and connect to you own node!)</ModalLink>
          </span>
        }
        imageUrl={L2}
      />
  <ImageSlide
        text={
          <span>
            Alternatively, to use the Portis or Fortmatic Wallets simply click "Connect to a wallet", select Portis or Fortmatic, login/sign up and get started.
          </span>
        }
        imageUrl={Portis}
        imageStyle={{minWidth: 200}}
      />
      <ImageSlide
        text={
          <span>
            If you already have Ether/tokens on Kovan, you can deposit them via our <ModalLink href="https://bridge.arbitrum.io/" target="_blank">token bridge.</ModalLink> <br/><br/>
            <span>Alternatively, claim some tokens directly from our <a href="http://faucet.arbitrum.io/" target="_blank">token faucet.</a></span>
          </span>
        }
        imageUrl={''}
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
        imageStyle={{minWidth: 200}}

      />

      <ImageSlide
        text={
          <span style={{fontSize: '13px'}}>
            Check out our <ModalLink href="https://explorer.offchainlabs.com/#" target="_blank">block explorer</ModalLink> to see Arbitrum transactions get processed in real time. <br/><br/> As a bonus, if you're using MetaMask, you can add our block explorer url and MetaMask will link to your transactions directly:
             
             <CopyLink url="https://explorer.offchainlabs.com/#" msg="Block explorer url copied to clipboard" />
          </span>
        }
        imageUrl={Explorer}
        imageStyle={{maxHeight: 230}}
      />
      <ImageSlide
        text={
          <span>
            For more info, check out our{' '}
            <ModalLink href="https://medium.com/offchainlabs" target="_blank">
              blog
            </ModalLink>
            , our{' '}
            <ModalLink href="https://developer.offchainlabs.com/docs/Developer_Quickstart/" target="_blank">
              developer docs
            </ModalLink>
            , the{' '}
            <ModalLink href="https://offchainlabs.com/" target="_blank">
              Offchain Labs website
            </ModalLink>
            , and join our{' '}
            <ModalLink href="https://discord.gg/ZpZuw7p" target="_blank">
            discord
            </ModalLink>.
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
