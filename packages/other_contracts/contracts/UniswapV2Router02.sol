pragma solidity =0.6.6;

import '@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol';
import '@uniswap/lib/contracts/libraries/TransferHelper.sol';

import './interfaces/IUniswapV2Router02.sol';
import './libraries/UniswapV2Library.sol';
import './libraries/SafeMath.sol';
import './interfaces/IERC20.sol';
import './interfaces/IWETH.sol';
import "solidity-bytes-utils/contracts/BytesLib.sol";
import './interfaces//ArbSys.sol';

contract UniswapV2Router02 is IUniswapV2Router02 {
    using SafeMath for uint;


    address public immutable override factory;
    address public immutable override WETH;
    address public constant arbSys = address(100);
    
    using BytesLib for bytes;

    modifier ensure(uint deadline) {
        require(deadline >= block.timestamp, 'UniswapV2Router: EXPIRED');
        _;
    }

    constructor(address _factory, address _WETH) public {
        factory = _factory;
        WETH = _WETH;
    }

    receive() external payable {
        assert(msg.sender == WETH); // only accept ETH via fallback from the WETH contract
    }

    // **** ADD LIQUIDITY ****
    function _addLiquidity(
        address tokenA,
        address tokenB,
        uint amountADesired,
        uint amountBDesired,
        uint amountAMin,
        uint amountBMin
    ) internal virtual returns (uint amountA, uint amountB) {
        // create the pair if it doesn't exist yet
        if (IUniswapV2Factory(factory).getPair(tokenA, tokenB) == address(0)) {
            IUniswapV2Factory(factory).createPair(tokenA, tokenB);
        }
        (uint reserveA, uint reserveB) = UniswapV2Library.getReserves(factory, tokenA, tokenB);
        if (reserveA == 0 && reserveB == 0) {
            (amountA, amountB) = (amountADesired, amountBDesired);
        } else {
            uint amountBOptimal = UniswapV2Library.quote(amountADesired, reserveA, reserveB);
            if (amountBOptimal <= amountBDesired) {
                require(amountBOptimal >= amountBMin, 'UniswapV2Router: INSUFFICIENT_B_AMOUNT');
                (amountA, amountB) = (amountADesired, amountBOptimal);
            } else {
                uint amountAOptimal = UniswapV2Library.quote(amountBDesired, reserveB, reserveA);
                assert(amountAOptimal <= amountADesired);
                require(amountAOptimal >= amountAMin, 'UniswapV2Router: INSUFFICIENT_A_AMOUNT');
                (amountA, amountB) = (amountAOptimal, amountBDesired);
            }
        }
    }
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint amountADesired,
        uint amountBDesired,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) external virtual override ensure(deadline) returns (uint amountA, uint amountB, uint liquidity) {
        (amountA, amountB) = _addLiquidity(tokenA, tokenB, amountADesired, amountBDesired, amountAMin, amountBMin);
        address pair = UniswapV2Library.pairFor(factory, tokenA, tokenB);
        TransferHelper.safeTransferFrom(tokenA, msg.sender, pair, amountA);
        TransferHelper.safeTransferFrom(tokenB, msg.sender, pair, amountB);
        liquidity = IUniswapV2Pair(pair).mint(to);
    }
    function _addLiquidityETH(
        address token,
        uint amountTokenDesired,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline,
        uint value
    ) internal ensure(deadline) returns (uint amountToken, uint amountETH, uint liquidity) {
        (amountToken, amountETH) = _addLiquidity(
            token,
            WETH,
            amountTokenDesired,
            value,
            amountTokenMin,
            amountETHMin
        );
        address pair = UniswapV2Library.pairFor(factory, token, WETH);
        TransferHelper.safeTransferFrom(token, msg.sender, pair, amountToken);
        IWETH(WETH).deposit{value: amountETH}();
        assert(IWETH(WETH).transfer(pair, amountETH));
        liquidity = IUniswapV2Pair(pair).mint(to);
        // refund dust eth, if any TODO?
        if (value > amountETH) TransferHelper.safeTransferETH(msg.sender, value - amountETH);
    }

    
    function addLiquidityETH(
        address token,
        uint amountTokenDesired,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) external virtual override payable ensure(deadline) returns (uint amountToken, uint amountETH, uint liquidity) {
        return _addLiquidityETH(token, amountTokenDesired, amountTokenMin, amountETHMin, to, deadline, msg.value);
    }

    function addLiquidityETH(
        bytes calldata args
    ) external virtual override payable returns (uint amountToken, uint amountETH, uint liquidity) {
        uint cursor = 0;
        
        uint8 isRegistered = args.toUint8(cursor);
        cursor += 1;
        address token; 
        (token, cursor ) = lookupAndRegisterAddress(args, isRegistered, cursor);


        uint amountTokenDesired = args.toUint(cursor);
        cursor += 32;

        uint amountTokenMin = args.toUint(cursor);
        cursor += 32;

        uint amountEthMin = args.toUint(cursor);
        cursor += 32;

        isRegistered = args.toUint8(cursor);
        cursor += 1;

        address to; 
        (to, cursor ) = lookupAndRegisterAddress(args, isRegistered, cursor);


        uint deadline = args.toUint(cursor);
        cursor += 32;

        return _addLiquidityETH(token, amountTokenDesired, amountTokenMin, amountEthMin, to, deadline, msg.value);
    }

    // **** REMOVE LIQUIDITY ****
    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint liquidity,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) public virtual override ensure(deadline) returns (uint amountA, uint amountB) {
        address pair = UniswapV2Library.pairFor(factory, tokenA, tokenB);
        IUniswapV2Pair(pair).transferFrom(msg.sender, pair, liquidity); // send liquidity to pair
        (uint amount0, uint amount1) = IUniswapV2Pair(pair).burn(to);
        (address token0,) = UniswapV2Library.sortTokens(tokenA, tokenB);
        (amountA, amountB) = tokenA == token0 ? (amount0, amount1) : (amount1, amount0);
        require(amountA >= amountAMin, 'UniswapV2Router: INSUFFICIENT_A_AMOUNT');
        require(amountB >= amountBMin, 'UniswapV2Router: INSUFFICIENT_B_AMOUNT');
    }
    function removeLiquidityETH(
        address token,
        uint liquidity,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) public virtual override ensure(deadline) returns (uint amountToken, uint amountETH) {
        (amountToken, amountETH) = removeLiquidity(
            token,
            WETH,
            liquidity,
            amountTokenMin,
            amountETHMin,
            address(this),
            deadline
        );
        TransferHelper.safeTransfer(token, to, amountToken);
        IWETH(WETH).withdraw(amountETH);
        TransferHelper.safeTransferETH(to, amountETH);
    }
    function removeLiquidityWithPermit(
        address tokenA,
        address tokenB,
        uint liquidity,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline,
        bool approveMax, uint8 v, bytes32 r, bytes32 s
    ) external virtual override returns (uint amountA, uint amountB) {
        address pair = UniswapV2Library.pairFor(factory, tokenA, tokenB);
        uint value = approveMax ? uint(-1) : liquidity;
        IUniswapV2Pair(pair).permit(msg.sender, address(this), value, deadline, v, r, s);
        (amountA, amountB) = removeLiquidity(tokenA, tokenB, liquidity, amountAMin, amountBMin, to, deadline);
    }
    function removeLiquidityETHWithPermit(
        address token,
        uint liquidity,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline,
        bool approveMax, uint8 v, bytes32 r, bytes32 s
    ) external virtual override returns (uint amountToken, uint amountETH) {
        address pair = UniswapV2Library.pairFor(factory, token, WETH);
        uint value = approveMax ? uint(-1) : liquidity;
        IUniswapV2Pair(pair).permit(msg.sender, address(this), value, deadline, v, r, s);
        (amountToken, amountETH) = removeLiquidityETH(token, liquidity, amountTokenMin, amountETHMin, to, deadline);
    }

    // **** REMOVE LIQUIDITY (supporting fee-on-transfer tokens) ****
    function removeLiquidityETHSupportingFeeOnTransferTokens(
        address token,
        uint liquidity,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) public virtual override ensure(deadline) returns (uint amountETH) {
        (, amountETH) = removeLiquidity(
            token,
            WETH,
            liquidity,
            amountTokenMin,
            amountETHMin,
            address(this),
            deadline
        );
        TransferHelper.safeTransfer(token, to, IERC20(token).balanceOf(address(this)));
        IWETH(WETH).withdraw(amountETH);
        TransferHelper.safeTransferETH(to, amountETH);
    }
    function removeLiquidityETHWithPermitSupportingFeeOnTransferTokens(
        address token,
        uint liquidity,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline,
        bool approveMax, uint8 v, bytes32 r, bytes32 s
    ) external virtual override returns (uint amountETH) {
        address pair = UniswapV2Library.pairFor(factory, token, WETH);
        uint value = approveMax ? uint(-1) : liquidity;
        IUniswapV2Pair(pair).permit(msg.sender, address(this), value, deadline, v, r, s);
        amountETH = removeLiquidityETHSupportingFeeOnTransferTokens(
            token, liquidity, amountTokenMin, amountETHMin, to, deadline
        );
    }

    // **** SWAP ****
    // requires the initial amount to have already been sent to the first pair
    function _swap(uint[] memory amounts, address[] memory path, address _to) internal virtual {
        for (uint i; i < path.length - 1; i++) {
            (address input, address output) = (path[i], path[i + 1]);
            (address token0,) = UniswapV2Library.sortTokens(input, output);
            uint amountOut = amounts[i + 1];
            (uint amount0Out, uint amount1Out) = input == token0 ? (uint(0), amountOut) : (amountOut, uint(0));
            address to = i < path.length - 2 ? UniswapV2Library.pairFor(factory, output, path[i + 2]) : _to;
            IUniswapV2Pair(UniswapV2Library.pairFor(factory, input, output)).swap(
                amount0Out, amount1Out, to, new bytes(0)
            );
        }
    }


    function _swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] memory path,
        address to,
        uint deadline,
        address sender
    ) internal ensure(deadline) returns (uint[] memory amounts) {
        amounts = UniswapV2Library.getAmountsOut(factory, amountIn, path);
        require(amounts[amounts.length - 1] >= amountOutMin, 'UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT');
        TransferHelper.safeTransferFrom(
            path[0], sender, UniswapV2Library.pairFor(factory, path[0], path[1]), amounts[0]
        );
        _swap(amounts, path, to);
    }

    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external virtual override ensure(deadline) returns (uint[] memory amounts) {
        return _swapExactTokensForTokens(amountIn, amountOutMin, path, to, deadline, msg.sender);
    }

    function swapExactTokensForTokens(
       bytes calldata args
    ) external virtual override  returns (uint[] memory amounts) {
        uint  cursor = 0;

        uint amountIn = args.toUint(cursor);
        cursor += 32;

        uint amountOutMin = args.toUint(cursor);
        cursor += 32; 

        uint8 pathLength = args.toUint8(cursor); 
        cursor += 1;
        uint8 isRegistered = args.toUint8(cursor);
        cursor += 1;
        address[] memory path  =  new address[](pathLength);
        for (uint i; i < pathLength; i++) {
            address addressToAdd; 
            (addressToAdd, cursor) = lookupAndRegisterAddress(args, isRegistered, cursor);
            path[i] = addressToAdd;
        }

        isRegistered = args.toUint8(cursor);
        cursor += 1;
        address to;
        (to, cursor) = lookupAndRegisterAddress(args, isRegistered, cursor);

        uint deadline = args.toUint(cursor);
        cursor += 32;


        return _swapExactTokensForTokens(amountIn, amountOutMin, path, to, deadline, msg.sender);
    }

    
    function _swapTokensForExactTokens(
        uint amountOut,
        uint amountInMax,
        address[] memory path,
        address to,
        uint deadline,
        address sender
    ) internal ensure(deadline) returns (uint[] memory amounts) {
        amounts = UniswapV2Library.getAmountsIn(factory, amountOut, path);
        require(amounts[0] <= amountInMax, 'UniswapV2Router: EXCESSIVE_INPUT_AMOUNT');
        TransferHelper.safeTransferFrom(
            path[0], sender, UniswapV2Library.pairFor(factory, path[0], path[1]), amounts[0]
        );
        _swap(amounts, path, to);
    }

    function swapTokensForExactTokens(
        uint amountOut,
        uint amountInMax,
        address[] calldata path,
        address to,
        uint deadline
    ) external virtual override returns (uint[] memory amounts) {
        return _swapTokensForExactTokens(amountOut, amountInMax, path, to, deadline, msg.sender);
    }

    function swapTokensForExactTokens(
        bytes calldata args
    ) external virtual override returns (uint[] memory amounts) {
        uint  cursor = 0;

        uint amountOut = args.toUint(cursor);
        cursor += 32;

        uint amountInMax = args.toUint(cursor);
        cursor += 32; 

        uint8 pathLength = args.toUint8(cursor); 
        cursor += 1;
        uint8 isRegistered = args.toUint8(cursor);
        cursor += 1;
        address[] memory path  =  new address[](pathLength);
        for (uint i; i < pathLength; i++) {
            address addressToAdd; 
            (addressToAdd, cursor) = lookupAndRegisterAddress(args, isRegistered, cursor);
            path[i] = addressToAdd;
        }

        isRegistered = args.toUint8(cursor);
        cursor += 1;
        address to;
        (to, cursor) = lookupAndRegisterAddress(args, isRegistered, cursor);
        uint deadline = args.toUint(cursor);
        cursor += 32;
        return _swapTokensForExactTokens(amountOut, amountInMax, path, to, deadline, msg.sender);

    }


    function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline)
            external
            virtual
            override
            payable
            returns (uint[] memory amounts)
        {
            return _swapExactETHForTokens(amountOutMin, path, to, deadline, msg.value);
        }

    function _swapExactETHForTokens(uint amountOutMin, address[] memory path, address to, uint deadline, uint value)
            internal
            ensure(deadline)
            returns (uint[] memory amounts)
        {
            require(path[0] == WETH, 'UniswapV2Router: INVALID_PATH');
            amounts = UniswapV2Library.getAmountsOut(factory, value, path);
            require(amounts[amounts.length - 1] >= amountOutMin, 'UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT');
            IWETH(WETH).deposit{value: amounts[0]}();
            assert(IWETH(WETH).transfer(UniswapV2Library.pairFor(factory, path[0], path[1]), amounts[0]));
            _swap(amounts, path, to);
        }
    function swapExactETHForTokens(bytes calldata args)
        external
        virtual
        override
        payable
        returns (uint[] memory amounts)
    { 
        uint cursor = 0; 
        uint amountOutMin = args.toUint(cursor);
        cursor += 32;


        uint8 pathLength = args.toUint8(cursor);
        cursor += 1;
        uint8 isRegistered = args.toUint8(cursor);
        cursor += 1;
        // Caller should leave out WETH from path (it's path[0] anyway)

        address[] memory path  =  new address[](pathLength + 1);
        path[0] = WETH;
        for (uint i; i < pathLength; i++) {
            address addressToAdd; 
            (addressToAdd, cursor) = lookupAndRegisterAddress(args, isRegistered, cursor);
            path[ i + 1 ] = addressToAdd;
        }

        isRegistered = args.toUint8(cursor);
        cursor += 1;
        
        address to;
        (to, cursor) =  lookupAndRegisterAddress(args, isRegistered, cursor);

        uint deadline = args.toUint(cursor);
        return _swapExactETHForTokens(amountOutMin, path, to, deadline, msg.value);
    }



    function _swapTokensForExactETH(uint amountOut, uint amountInMax, address[] memory path, address to, uint deadline)
        internal
        ensure(deadline)
        returns (uint[] memory amounts)
    {
        require(path[path.length - 1] == WETH, 'UniswapV2Router: INVALID_PATH');
        amounts = UniswapV2Library.getAmountsIn(factory, amountOut, path);
        require(amounts[0] <= amountInMax, 'UniswapV2Router: EXCESSIVE_INPUT_AMOUNT');
        TransferHelper.safeTransferFrom(
            path[0], msg.sender, UniswapV2Library.pairFor(factory, path[0], path[1]), amounts[0]
        );
        _swap(amounts, path, address(this));
        IWETH(WETH).withdraw(amounts[amounts.length - 1]);
        TransferHelper.safeTransferETH(to, amounts[amounts.length - 1]);
    }

    function swapTokensForExactETH(bytes calldata args)
        external
        virtual
        override
        returns (uint[] memory amounts)
    {   
        uint cursor = 0;

        uint amountOut = args.toUint(cursor);
        cursor += 32;

        uint amountInMax = args.toUint(cursor);
        cursor += 32;

        uint8 pathLength = args.toUint8(cursor); 
        cursor += 1;
        uint8 isRegistered = args.toUint8(cursor);
        cursor += 1;
        // Caller should leave out WETH from path (it's end of path anyway)

        address[] memory path  =  new address[](pathLength + 1);
        for (uint i; i < pathLength; i++) {
            address addressToAdd; 
            (addressToAdd, cursor) = lookupAndRegisterAddress(args, isRegistered, cursor);
            path[i] = addressToAdd;
        }
        path[pathLength] = WETH;

        isRegistered = args.toUint8(cursor);
        cursor += 1;

         address to;
         (to, cursor) =  lookupAndRegisterAddress(args, isRegistered, cursor);
        
        uint deadline = args.toUint(cursor);

        return _swapTokensForExactETH (amountOut, amountInMax,  path, to, deadline);
    }

    function swapTokensForExactETH(uint amountOut, uint amountInMax, address[] calldata path, address to, uint deadline)
        external
        virtual
        override
        returns (uint[] memory amounts)
    {
        return _swapTokensForExactETH (amountOut, amountInMax, path, to, deadline);
    }



    function _swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] memory path, address to, uint deadline, address sender)
        internal
        ensure(deadline)
        returns (uint[] memory amounts)
    {
        require(path[path.length - 1] == WETH, 'UniswapV2Router: INVALID_PATH');
        amounts = UniswapV2Library.getAmountsOut(factory, amountIn, path);
        require(amounts[amounts.length - 1] >= amountOutMin, 'UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT');
        TransferHelper.safeTransferFrom(
            path[0], sender, UniswapV2Library.pairFor(factory, path[0], path[1]), amounts[0]
        );
        _swap(amounts, path, address(this));
        IWETH(WETH).withdraw(amounts[amounts.length - 1]);
        TransferHelper.safeTransferETH(to, amounts[amounts.length - 1]);
    }

    function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline)
        external
        virtual
        override
        returns (uint[] memory amounts)
    {
        return _swapExactTokensForETH(amountIn, amountOutMin, path, to, deadline, msg.sender);
    }

    function swapExactTokensForETH(bytes calldata args)
        external
        virtual
        override
        returns (uint[] memory amounts)
    {           
        uint  cursor = 0;

        uint amountIn = args.toUint(cursor);
        cursor += 32;

        uint amountOutMin = args.toUint(cursor);
        cursor += 32; 

        uint8 pathLength = args.toUint8(cursor); 
        cursor += 1;
        uint8 isRegistered = args.toUint8(cursor);
        cursor += 1;
        // caller leaves out weth
        address[] memory path  =  new address[](pathLength + 1);
        for (uint i; i < pathLength; i++) {
            address addressToAdd; 
            (addressToAdd, cursor) = lookupAndRegisterAddress(args, isRegistered, cursor);
            path[i] = addressToAdd;
        }
        path[pathLength] = WETH;

        isRegistered = args.toUint8(cursor);
        cursor += 1;
        address to;
        (to, cursor) = lookupAndRegisterAddress(args, isRegistered, cursor);

        uint deadline = args.toUint(cursor);
        cursor += 32;

        return _swapExactTokensForETH(amountIn, amountOutMin, path, to, deadline, msg.sender);

    }



    function _swapETHForExactTokens(uint amountOut, address[] memory path, address to, uint deadline, uint value)
        internal
        ensure(deadline)
        returns (uint[] memory amounts)
    {
        require(path[0] == WETH, 'UniswapV2Router: INVALID_PATH');
        amounts = UniswapV2Library.getAmountsIn(factory, amountOut, path);
        require(amounts[0] <= value, 'UniswapV2Router: EXCESSIVE_INPUT_AMOUNT');
        IWETH(WETH).deposit{value: amounts[0]}();
        assert(IWETH(WETH).transfer(UniswapV2Library.pairFor(factory, path[0], path[1]), amounts[0]));
        _swap(amounts, path, to);
        // refund dust eth, if any
        if (value > amounts[0]) TransferHelper.safeTransferETH(msg.sender, value - amounts[0]);
    }
    function swapETHForExactTokens(uint amountOut, address[] calldata path, address to, uint deadline)
        external
        virtual
        override
        payable
        returns (uint[] memory amounts)
    {
        return _swapETHForExactTokens(amountOut, path, to, deadline, msg.value);
    }
        function swapETHForExactTokens(bytes calldata args)
        external
        virtual
        override
        payable
        returns (uint[] memory amounts)
    {        
        uint  cursor = 0;


        uint amountOut = args.toUint(cursor);
        cursor += 32; 

        uint8 pathLength = args.toUint8(cursor); 
        cursor += 1;
        uint8 isRegistered = args.toUint8(cursor);
        cursor += 1;
        address[] memory path  =  new address[](pathLength + 1);
        // caller leaves out WETH
        path[0] = WETH;
        for (uint i; i < pathLength; i++) {
            address addressToAdd; 
            (addressToAdd, cursor) = lookupAndRegisterAddress(args, isRegistered, cursor);
            path[ i +1 ] = addressToAdd;
        }

        isRegistered = args.toUint8(cursor);
        cursor += 1;
        address to;
        (to, cursor) = lookupAndRegisterAddress(args, isRegistered, cursor);

        uint deadline = args.toUint(cursor);
        cursor += 32;

        return _swapETHForExactTokens(amountOut, path, to, deadline, msg.value);

    }


    // **** SWAP (supporting fee-on-transfer tokens) ****
    // requires the initial amount to have already been sent to the first pair
    function _swapSupportingFeeOnTransferTokens(address[] memory path, address _to) internal virtual {
        for (uint i; i < path.length - 1; i++) {
            (address input, address output) = (path[i], path[i + 1]);
            (address token0,) = UniswapV2Library.sortTokens(input, output);
            IUniswapV2Pair pair = IUniswapV2Pair(UniswapV2Library.pairFor(factory, input, output));
            uint amountInput;
            uint amountOutput;
            { // scope to avoid stack too deep errors
            (uint reserve0, uint reserve1,) = pair.getReserves();
            (uint reserveInput, uint reserveOutput) = input == token0 ? (reserve0, reserve1) : (reserve1, reserve0);
            amountInput = IERC20(input).balanceOf(address(pair)).sub(reserveInput);
            amountOutput = UniswapV2Library.getAmountOut(amountInput, reserveInput, reserveOutput);
            }
            (uint amount0Out, uint amount1Out) = input == token0 ? (uint(0), amountOutput) : (amountOutput, uint(0));
            address to = i < path.length - 2 ? UniswapV2Library.pairFor(factory, output, path[i + 2]) : _to;
            pair.swap(amount0Out, amount1Out, to, new bytes(0));
        }
    }
    function swapExactTokensForTokensSupportingFeeOnTransferTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external virtual override ensure(deadline) {
        TransferHelper.safeTransferFrom(
            path[0], msg.sender, UniswapV2Library.pairFor(factory, path[0], path[1]), amountIn
        );
        uint balanceBefore = IERC20(path[path.length - 1]).balanceOf(to);
        _swapSupportingFeeOnTransferTokens(path, to);
        require(
            IERC20(path[path.length - 1]).balanceOf(to).sub(balanceBefore) >= amountOutMin,
            'UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT'
        );
    }
    function swapExactETHForTokensSupportingFeeOnTransferTokens(
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    )
        external
        virtual
        override
        payable
        ensure(deadline)
    {
        require(path[0] == WETH, 'UniswapV2Router: INVALID_PATH');
        uint amountIn = msg.value;
        IWETH(WETH).deposit{value: amountIn}();
        assert(IWETH(WETH).transfer(UniswapV2Library.pairFor(factory, path[0], path[1]), amountIn));
        uint balanceBefore = IERC20(path[path.length - 1]).balanceOf(to);
        _swapSupportingFeeOnTransferTokens(path, to);
        require(
            IERC20(path[path.length - 1]).balanceOf(to).sub(balanceBefore) >= amountOutMin,
            'UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT'
        );
    }
    function swapExactTokensForETHSupportingFeeOnTransferTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    )
        external
        virtual
        override
        ensure(deadline)
    {
        require(path[path.length - 1] == WETH, 'UniswapV2Router: INVALID_PATH');
        TransferHelper.safeTransferFrom(
            path[0], msg.sender, UniswapV2Library.pairFor(factory, path[0], path[1]), amountIn
        );
        _swapSupportingFeeOnTransferTokens(path, address(this));
        uint amountOut = IERC20(WETH).balanceOf(address(this));
        require(amountOut >= amountOutMin, 'UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT');
        IWETH(WETH).withdraw(amountOut);
        TransferHelper.safeTransferETH(to, amountOut);
    }


    function lookupAndRegisterAddress(bytes memory args, uint8 isRegistered, uint oldCursor ) internal returns(address _address, uint newCursor){
        require(isRegistered <= 1, "UniswapV2Router, Invalid address-registered status");
        address _address; 
        if(isRegistered == 1){
            _address = ArbSys(arbSys).addressTable_lookupIndex(  args.toUint32(oldCursor));
            require(_address != address(0), "UniswapV2Router: Address not registered in table");
            return (_address, oldCursor + 4);
        } else {
            _address =  args.toAddress(oldCursor);
            ArbSys(arbSys).addressTable_lookupAddress(_address, true);
            return (_address, oldCursor + 20);
        }

    }

    // **** LIBRARY FUNCTIONS ****
    function quote(uint amountA, uint reserveA, uint reserveB) public pure virtual override returns (uint amountB) {
        return UniswapV2Library.quote(amountA, reserveA, reserveB);
    }

    function getAmountOut(uint amountIn, uint reserveIn, uint reserveOut)
        public
        pure
        virtual
        override
        returns (uint amountOut)
    {
        return UniswapV2Library.getAmountOut(amountIn, reserveIn, reserveOut);
    }

    function getAmountIn(uint amountOut, uint reserveIn, uint reserveOut)
        public
        pure
        virtual
        override
        returns (uint amountIn)
    {
        return UniswapV2Library.getAmountIn(amountOut, reserveIn, reserveOut);
    }

    function getAmountsOut(uint amountIn, address[] memory path)
        public
        view
        virtual
        override
        returns (uint[] memory amounts)
    {
        return UniswapV2Library.getAmountsOut(factory, amountIn, path);
    }

    function getAmountsIn(uint amountOut, address[] memory path)
        public
        view
        virtual
        override
        returns (uint[] memory amounts)
    {
        return UniswapV2Library.getAmountsIn(factory, amountOut, path);
    }
}
