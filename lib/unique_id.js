'use strict';

let startTimestamp = (new Date()).getTime();
let startHRtime = process.hrtime();
let currentTimestamp = null;
let machineID = null;

const defaults =
{
  min: 0,
  max: Number.MAX_SAFE_INTEGER,
  unique_interval: 86400,
}

function getBinary( number, length )
{
  return ('0'.repeat( length ) + number.toString(2)).substr(-length);
}

function hash32( data )
{
  const sha1 = require('crypto').createHash('sha1');
  sha1.update( data );

  return parseInt( sha1.digest('hex').substr(0, 8), 16 );
}

module.exports = class UniqueID
{
  constructor( options = {} )
  {
    let min = Math.ceil( options.min || defaults.min ),
        max = Math.floor( options.max || defaults.max ),
        unique_interval = options.unique_interval || defaults.unique_interval;

    this.generator =
    {
      prefix: options.prefix,
      min,
      max,
      id:         { bits: Math.floor( Math.log2( max - min ) ), max: 0 },
      timestamp:  { bits: Math.ceil( Math.log2( unique_interval * 1000 ) ), max: 0, offset: 0 },
      node:       { bits: 0, max: 0, offset: 0, value: typeof options.node_id !== 'undefined' ? hash32( options.node_id ) : ( machineID !== null ? machineID : Math.floor( Math.random() * Math.pow( 2, 32 ) ) ) },
      pid:        { bits: 0, max: 0, offset: 0, value: process.pid },
      iterator:   { bits: 0, max: 0, value: 0 }
    };

    if( Math.ceil( ( this.generator.id.bits - this.generator.timestamp.bits ) * 2 / 5 ) < 8 )
    {
      throw 'Error: small range for generator uniqueness, increase min/max or lower the unique interval';
    }

    if( typeof options.node_id === 'undefined' && machineID === null )
    {
      require('./machine_id')().then( id =>
      {
        this.generator.node.value = ( ( machineID = hash32( id ) ) % this.generator.node.max ) * this.generator.node.offset;
      });
    }

    this.generator.node.bits = this.generator.pid.bits = this.generator.iterator.bits = Math.ceil( ( this.generator.id.bits - this.generator.timestamp.bits ) * 2 / 5 );

    this.generator.id.max = Math.pow( 2, this.generator.id.bits );
    this.generator.timestamp.max = Math.pow( 2, this.generator.timestamp.bits );
    this.generator.node.max = this.generator.pid.max = this.generator.iterator.max = Math.pow( 2, this.generator.iterator.bits );

    this.generator.timestamp.offset = Math.pow( 2, this.generator.id.bits - this.generator.timestamp.bits );
    this.generator.node.offset = Math.pow( 2, this.generator.id.bits - this.generator.timestamp.bits - this.generator.node.bits );
    this.generator.pid.offset = Math.pow( 2, this.generator.iterator.bits );

    this.generator.node.value = ( this.generator.node.value % this.generator.node.max ) * this.generator.node.offset;
    this.generator.pid.value = ( this.generator.pid.value % this.generator.pid.max ) * this.generator.pid.offset;
    this.generator.iterator.value = Math.floor( Math.random() * this.generator.iterator.max );

    /*console.log( this.generator );

    console.log('-----');
    console.log( 'id   : ' + getBinary( this.generator.id.max - 1, this.generator.id.bits ) );
    console.log( 'time : ' + getBinary( ( this.generator.timestamp.max - 1 ) * this.generator.timestamp.offset, this.generator.id.bits ) );
    console.log( 'node : ' + getBinary( ( this.generator.node.max - 1 ) * this.generator.node.offset, this.generator.id.bits ) );
    console.log( 'pid  : ' + getBinary( ( this.generator.pid.max - 1 ) * this.generator.pid.offset, this.generator.id.bits ) );
    console.log( 'iter : ' + getBinary( this.generator.iterator.max - 1, this.generator.id.bits ) );
    console.log('-----');*/
  }

  get()
  {
    if( currentTimestamp === null )
    {
      let elapsedHRTime = process.hrtime( startHRtime );

      currentTimestamp = startTimestamp + elapsedHRTime[0] * 1000 + Math.round( elapsedHRTime[1] / 1e6 );

      setImmediate( () => { currentTimestamp = null; } );
    }

    let id = ( ( currentTimestamp % this.generator.timestamp.max ) * this.generator.timestamp.offset ) +
      this.generator.node.value + this.generator.pid.value +
      ( this.generator.iterator.value = ( this.generator.iterator.value + 1 ) % this.generator.iterator.max ) +
      this.generator.min;

    return ( this.prefix ? this.prefix + id : id );
  }
}
