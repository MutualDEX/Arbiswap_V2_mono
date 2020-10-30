import Modal from '../Modal'
import React, { useState, useEffect, useCallback } from 'react'
import styled from 'styled-components'
import Carousel from './WelcomeCarousel'
import { useActiveWeb3React } from '../../hooks'
const arbChainId = +process.env.REACT_APP_CHAIN_ID
const ModalContainer = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap}
  // min-height: 1000px;
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  padding-top: 30px;
`
// TODO: hide buttons

function WelcomeModal({ shouldOpenModalCache, setShouldOpenModalCache }) {
  const [isOpen, setModalIsOpen] = useState(false)
  const [delay, setDelay] = useState(1500)
  // const [wrongNetworkOnInitialLoad, setWrongNetworkOnInitialLoad] = useState(false)

  const { chainId } =  useActiveWeb3React()

  useEffect(() => {
    shouldOpenModalCache &&
      window.setTimeout(() => {
        setModalIsOpen(true)
      }, delay)
    setDelay(0)
  }, [delay, shouldOpenModalCache])



  useEffect(()=>{
    if (typeof chainId === "number" && chainId !== arbChainId){
      window.setTimeout(() => {
        setModalIsOpen(true)
      }, delay)
    }

  }, [chainId])



  const onDismiss = useCallback(() => {
    setModalIsOpen(false)
    shouldOpenModalCache && setShouldOpenModalCache(false)
  }, [setShouldOpenModalCache, shouldOpenModalCache])

  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} minHeight={'70'} initialFocusRef={true}>
      <ModalContainer>
        <Carousel closeModal={()=>  onDismiss()} />
      </ModalContainer>
    </Modal>
  )
}

export default WelcomeModal
