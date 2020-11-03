import { CurrencyAmount, Token } from '@uniswap/sdk'
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { ThemeContext } from 'styled-components'
import { ButtonLight } from '../../components/Button'
import { AutoColumn } from '../../components/Column'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import { SwapPoolTabs } from '../../components/NavigationTabs'
import { AutoRow } from '../../components/Row'
import AdvancedSwapDetailsDropdown from '../../components/swap/AdvancedSwapDetailsDropdown'
import { BottomGrouping, Wrapper } from '../../components/swap/styleds'
import TokenWarningModal from '../../components/TokenWarningModal'


import { useCurrency } from '../../hooks/Tokens'
import { ApprovalState, useApproveCallbackFromTrade } from '../../hooks/useApproveCallback'
import useToggledVersion, { Version } from '../../hooks/useToggledVersion'
import useWrapCallback, { WrapType } from '../../hooks/useWrapCallback'
import { Field } from '../../state/swap/actions'
import {
  useDefaultsFromURLSearch,
  useDerivedSwapInfo,
  useSwapActionHandlers,
  useSwapState
} from '../../state/swap/hooks'
import { useExpertModeManager, useUserSlippageTolerance } from '../../state/user/hooks'
import { LinkStyledButton, ExternalLink } from '../../theme'
import { maxAmountSpend } from '../../utils/maxAmountSpend'
import AppBody from '../AppBody'
import styled from 'styled-components'
import { darken } from 'polished'
import { TokenType } from 'token-bridge-sdk'
import { useTransactionAdder } from '../../state/transactions/hooks'

import { TransactionResponse } from '@ethersproject/providers'

const Container = styled.div<{ hideInput: boolean }>`
  border-radius: ${({ hideInput }) => (hideInput ? '8px' : '20px')};
  border: 1px solid ${({ theme }) => theme.bg2};
  background-color: ${({ theme }) => theme.bg1};
`
const LabelRow = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  color: ${({ theme }) => theme.text1};
  // font-size: 0.75rem;
  line-height: 1rem;
  padding: 0.75rem 1rem 0 1rem;
  span:hover {
    cursor: pointer;
    color: ${({ theme }) => darken(0.2, theme.text2)};
  }
`

// todo: return types? meh.
interface BridgeProps {
  withdrawEth: (val: string, res?: boolean)=>any,
  withdrawToken: (add:string, val: string,res?: boolean)=> any,
  bridgeTokens: any,
  addToken: (address: string, type: TokenType)=> Promise<string>
}
export default function Bridge({withdrawEth, withdrawToken, bridgeTokens, addToken}: BridgeProps) {
  const loadedUrlParams = useDefaultsFromURLSearch()
  const addTransaction = useTransactionAdder()

  // token warning stuff
  const [loadedInputCurrency, loadedOutputCurrency] = [
    useCurrency(loadedUrlParams?.inputCurrencyId),
    useCurrency(loadedUrlParams?.outputCurrencyId)
  ]
  const [dismissTokenWarning, setDismissTokenWarning] = useState<boolean>(false)
  const urlLoadedTokens: Token[] = useMemo(
    () => [loadedInputCurrency, loadedOutputCurrency]?.filter((c): c is Token => c instanceof Token) ?? [],
    [loadedInputCurrency, loadedOutputCurrency]
  )
  const handleConfirmTokenWarning = useCallback(() => {
    setDismissTokenWarning(true)
  }, [])

  const theme = useContext(ThemeContext)



  // for expert mode
  const [isExpertMode] = useExpertModeManager()

  // get custom setting values for user
  const [allowedSlippage] = useUserSlippageTolerance()

  // swap state
  const { independentField, typedValue, recipient } = useSwapState()
  const {
    v1Trade,
    v2Trade,
    currencyBalances,
    parsedAmount,
    currencies

  } = useDerivedSwapInfo()
  const { wrapType } = useWrapCallback(
    currencies[Field.INPUT],
    currencies[Field.OUTPUT],
    typedValue
  )
  const showWrap: boolean = wrapType !== WrapType.NOT_APPLICABLE
  const toggledVersion = useToggledVersion()
  const trade = showWrap
    ? undefined
    : {
        [Version.v1]: v1Trade,
        [Version.v2]: v2Trade
      }[toggledVersion]

  const parsedAmounts = showWrap
    ? {
        [Field.INPUT]: parsedAmount,
        [Field.OUTPUT]: parsedAmount
      }
    : {
        [Field.INPUT]: independentField === Field.INPUT ? parsedAmount : trade?.inputAmount,
        [Field.OUTPUT]: independentField === Field.OUTPUT ? parsedAmount : trade?.outputAmount
      }

  const { onCurrencySelection, onUserInput, onChangeRecipient } = useSwapActionHandlers()
  const dependentField: Field = independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT

  const handleTypeInput = useCallback(
    (value: string) => {
      onUserInput(Field.INPUT, value)
    },
    [onUserInput]
  )


  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]: showWrap
      ? parsedAmounts[independentField]?.toExact() ?? ''
      : parsedAmounts[dependentField]?.toSignificant(6) ?? ''
  }


  // check whether the user has approved the router on the input token
  const [approval, approveCallback] = useApproveCallbackFromTrade(trade, allowedSlippage)

  // check if user has gone through approval process, used to show two step buttons, reset on token change
  const [approvalSubmitted, setApprovalSubmitted] = useState<boolean>(false)

  // mark when a user has submitted an approval, reset onTokenSelection for input field
  useEffect(() => {
    if (approval === ApprovalState.PENDING) {
      setApprovalSubmitted(true)
    }
  }, [approval, approvalSubmitted])

  const maxAmountInput: CurrencyAmount | undefined = maxAmountSpend(currencyBalances[Field.INPUT])
  const atMaxAmountInput = Boolean(maxAmountInput && parsedAmounts[Field.INPUT]?.equalTo(maxAmountInput))

  const currencyValue = formattedAmounts[Field.INPUT]
  const currency = currencies[Field.INPUT]

  const handleWithdraw = useCallback(()=>{
    if (!currency) return;
    if (currency.symbol === "ETH"){
      withdrawEth(currencyValue, true).then((tx:TransactionResponse)=>{
        addTransaction(tx,{ summary: `Withdraw ${currencyValue} ETH to L1`})
      })

    } else {
      const currentCurrency = currency as Token
      addToken(currentCurrency.address, TokenType.ERC20).then(()=>{

        withdrawToken(currentCurrency.address, currencyValue, true).then((tx:TransactionResponse)=>{
          addTransaction(tx,{ summary: `Withdraw ${currency.symbol || currency.name} Token to L1`})

        })

      })
    }
  }, [currencyValue, currency, withdrawEth, withdrawToken])


  // err
  // warnings on slippage




  const handleInputSelect = useCallback(
    inputCurrency => {      
      setApprovalSubmitted(false) // reset 2 step UI for approvals
      onCurrencySelection(Field.INPUT, inputCurrency)
      if (!inputCurrency || inputCurrency.symbol === "ETH")return
      const currentCurrency = inputCurrency as Token
      if( !bridgeTokens[currentCurrency.address]){
        addToken(currentCurrency.address, TokenType.ERC20)
      }
    },
    [onCurrencySelection, bridgeTokens]
  )

  const handleMaxInput = useCallback(() => {
    maxAmountInput && onUserInput(Field.INPUT, maxAmountInput.toExact())
  }, [maxAmountInput, onUserInput])



  return (
    <>
      <TokenWarningModal
        isOpen={urlLoadedTokens.length > 0 && !dismissTokenWarning}
        tokens={urlLoadedTokens}
        onConfirm={handleConfirmTokenWarning}
      />
      <AppBody>
        <SwapPoolTabs active={'bridge'} />
        <Wrapper id="bridge-page">

          <AutoColumn gap={'md'}>
            <CurrencyInputPanel
              label={'Withdraw To L1'}
              value={formattedAmounts[Field.INPUT]}
              showMaxButton={!atMaxAmountInput}
              currency={currencies[Field.INPUT]}
              onUserInput={handleTypeInput}
              onMax={handleMaxInput}
              onCurrencySelect={handleInputSelect}
              otherCurrency={currencies[Field.OUTPUT]}
              id="swap-currency-input"
            />
            <AutoColumn justify="space-between">
              <AutoRow justify={isExpertMode ? 'space-between' : 'center'} style={{ padding: '0 1rem' }}>

                {recipient === null && !showWrap && isExpertMode ? (
                  <LinkStyledButton id="add-recipient-button" onClick={() => onChangeRecipient('')}>
                    + Add a send (optional)
                  </LinkStyledButton>
                ) : null}
              </AutoRow>
            </AutoColumn>
            <Container hideInput={false}>
            <LabelRow>

                  <ExternalLink href="https://bridge.arbitrum.io/">Visit Bridge Page To Deposit Assets Into Arbitrum Chain</ExternalLink>
            </LabelRow>
            </Container>



          </AutoColumn>
          <BottomGrouping>
          <ButtonLight disabled={+currencyValue === 0} onClick={handleWithdraw}>Withdraw</ButtonLight>
          </BottomGrouping>
        </Wrapper>
      </AppBody>
      <AdvancedSwapDetailsDropdown trade={trade} />
    </>
  )
}
