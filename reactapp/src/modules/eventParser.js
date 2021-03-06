const EVENTLOADCHUNK = 5120;
let LASTBLOCK;
let ENDBLOCK;

const DEBUG = false;

export default function(contract,eventName,endingBlock,startingBlock,updateFn,filter){
  LASTBLOCK=parseInt(startingBlock)
  ENDBLOCK=parseInt(endingBlock)
  loadDownTheChain(contract,eventName,updateFn,filter)
}
let loadDownTheChain = async (contract,eventName,updateFn,filter)=>{
  while(LASTBLOCK>=ENDBLOCK){
    let nextLast = LASTBLOCK-EVENTLOADCHUNK
    if(nextLast<ENDBLOCK) nextLast=ENDBLOCK
    await doSync(contract,eventName,updateFn,nextLast,LASTBLOCK,filter);
    LASTBLOCK=nextLast-1
  }
}
let doSync = async (contract,eventName,updateFn,from,to,filter)=>{
  if(DEBUG) console.log("EVENT:",eventName,"FROM",from,"to",to,contract)
  let events
  try{
    if(filter){
      events = await contract.getPastEvents(eventName, {
        filter: filter,
        fromBlock: from,
        toBlock: to
      });
    }else{
      events = await contract.getPastEvents(eventName, {
        fromBlock: from,
        toBlock: to
      });
    }

    for(let e in events){
      let thisEvent = events[e].returnValues
      thisEvent.blockNumber = events[e].blockNumber
      updateFn(thisEvent);
    }
  }catch(e){console.log(e)}

  return true;
}
