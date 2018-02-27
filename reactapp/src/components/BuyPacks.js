import React from 'react'
import createClass from 'create-react-class';
import { BrowserRouter as Router, Route, Link } from "react-router-dom";
import PropTypes from 'prop-types';
import MMButton from '../components/MMButton.js'
import Pack from '../components/Pack.js'

let loadInterval
let initialIntervalLoaded

const MINTEDPACKDISPLAYLIMIT = 10

const GWEI=10

export default createClass({
	contextTypes: {
		web3: PropTypes.object,
		contracts: PropTypes.array,
		account: PropTypes.string,
		myTokens: PropTypes.array,
		metaMaskHintFn: PropTypes.func,
		showLoadingScreen: PropTypes.func,
	},
	getInitialState(){
		return {mintedPacks:[],shouldHaveLoaded:false}
	},
	componentDidMount(){
		this.loadPackData()
		loadInterval = setInterval(this.loadPackData,777)
	},
	componentWillUnmount(){
		clearInterval(loadInterval)
	},
	async loadPackData(){
		let foundNew = false
		let {contracts,web3} = this.context
		if(contracts && contracts['Cryptogs']) {
			let update = {}

			let mintPackEvents = await contracts['Cryptogs'].getPastEvents("MintPack", {
				fromBlock: contracts['Cryptogs'].blockNumber,
				toBlock: 'latest'
			});

			for(let e in mintPackEvents){
				let id = mintPackEvents[e].returnValues.packId;
				if(!this.state.mintedPacks[id]){
					foundNew=true;
					this.state.mintedPacks[id]={price:web3.utils.fromWei(mintPackEvents[e].returnValues.price,"ether"),tokens:[]};
					this.state.mintedPacks[id].tokens = []
					this.state.mintedPacks[id].images = []
					for(let i=1;i<=10;i++){
						let tokenid = mintPackEvents[e].returnValues["token"+i];
						let token = await contracts['Cryptogs'].methods.getToken(tokenid).call()
						this.state.mintedPacks[id].tokens[i-1] = tokenid
						this.state.mintedPacks[id].images[i-1] = web3.utils.toAscii(token.image).replace(/[^a-zA-Z\d\s.]+/g,"")
					}
				}
			}

			let buyPackEvents = await contracts['Cryptogs'].getPastEvents("BuyPack", {
				fromBlock: contracts['Cryptogs'].blockNumber,
				toBlock: 'latest'
			});

			for(let e in buyPackEvents){
				let id = buyPackEvents[e].returnValues.packId;
				if(this.state.mintedPacks[id]&&!this.state.mintedPacks[id].bought){
					foundNew=true;
					this.state.mintedPacks[id].bought = buyPackEvents[e].returnValues.sender
				}
			}

			if(foundNew) {
				console.log("UPDATING MINTED PACKS",this.state.mintedPacks)
				this.setState({mintedPacks:this.state.mintedPacks})
			}
			this.setState({shouldHaveLoaded:true})
		}
	},
	render(){
    const { compact } = this.props
		const { account,contracts,web3,metaMaskHintFn,showLoadingScreen } = this.context
		if(!contracts || !contracts['Cryptogs'] ) return (<div style={{opacity:0.3}}>loading...</div>)

		const { mintedPacks,shouldHaveLoaded } = this.state
		if(!mintedPacks) return (<div style={{opacity:0.3}}>connecting...</div>)
    let mintedPackRender

    if(compact){

			let buypacks = []
			let displycount = 0
			for(let p in mintedPacks){
  			if(!mintedPacks[p].bought){
  				if(displycount++<4){
  					buypacks.push(
  						<Pack compact={true} id={p} key={"pack"+p} {...mintedPacks[p]} PackClick={
  							(p)=>{
  								if(!account){
  									metaMaskHintFn()
  								}else{
  									contracts["Cryptogs"].methods.buyPack(p).send({
  							        from: account,
  											value: web3.utils.toWei(mintedPacks[p].price,"ether"),
  							        gas:490000,
  							        gasPrice:GWEI * 1000000000
  							      },(error,hash)=>{
  							        console.log("CALLBACK!",error,hash)
												showLoadingScreen(hash)
  							      }).on('error',(a,b)=>{console.log("ERROR",a,b)}).then((receipt)=>{
  							        console.log("RESULT:",receipt)
												showLoadingScreen(false)
  											window.location = "/address/"+account
  							      })
  								}
  							}
  						}/>
  					)
  				}
  			}
  		}

      mintedPackRender = (
				<div className={"centercontainer"}>
	        <div className={"twobytwogrid"}>
	          <div className={"twobytwobox"}>
							{buypacks[0]}
	          </div>
	          <div className={"twobytwobox"}>
							{buypacks[1]}
	          </div>
	          <div className={"twobytwobox"}>
							{buypacks[2]}
	          </div>
	          <div className={"twobytwobox"}>
							{buypacks[3]}
	          </div>
	        </div>
					<div style={{padding:40}}>
						<MMButton color={"#6081c3"} onClick={()=>{window.location="/buy"}}>View All Packs</MMButton>
					</div>
				</div>
      )

    }else{
      mintedPackRender = []
  		let displycount = 0
  		for(let p in mintedPacks){
  			if(!mintedPacks[p].bought){
  				if(displycount++<MINTEDPACKDISPLAYLIMIT){
  					mintedPackRender.push(
  						<Pack id={p} key={"pack"+p} {...mintedPacks[p]} PackClick={
  							(p)=>{
  								if(!account){
  									metaMaskHintFn()
  								}else{
  									contracts["Cryptogs"].methods.buyPack(p).send({
  							        from: account,
  											value: web3.utils.toWei(mintedPacks[p].price,"ether"),
  							        gas:490000,
  							        gasPrice:GWEI * 1000000000
  							      },(error,hash)=>{
  							        console.log("CALLBACK!",error,hash)
												showLoadingScreen(hash)
  							      }).on('error',(a,b)=>{console.log("ERROR",a,b)}).then((receipt)=>{
  							        console.log("RESULT:",receipt)
  											window.location = "/address/"+account
												showLoadingScreen(false)
  							      })
  								}
  							}
  						}/>
  					)
  				}
  			}
  		}
    }

		if(mintedPackRender.length<=0){
			if(shouldHaveLoaded){
				mintedPackRender = (
					<div style={{padding:80}}>
						<div>All packs have sold out.</div>
						<div style={{marginTop:40}}>Please wait for more to be minted or look to secondary ERC721 markets.</div>
						<div style={{marginTop:40}}>Thanks!</div>
					</div>
				)
			}else{
				mintedPackRender = (
					<div style={{padding:80}}>
						<div style={{opacity:0.3}}>Loading...</div>
					</div>
				)
			}
		}

		return (
			<div>
				{mintedPackRender}
			</div>
		)
	}
});