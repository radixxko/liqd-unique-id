'use strict';

const generatedIDs = new Set();

const UniqueID = require('../lib/unique_id');

let sessionID = new UniqueID({ /*unique_interval: 365 * 24 * 3600,*/unique_interval: 60, node: true });

let start = process.hrtime();
let ids = 0;

function generate()
{
  let id;
  let elapsed = process.hrtime(start);

  if( elapsed[0] > 5 )
  {
    console.log( ids + ' ids' );
    console.log( ( ids / ( elapsed[0] + elapsed[1] / 1e9 ) ) + ' ids / sec' );

    process.exit();
  }

  for( let i = 0; i < 256; ++i )
  {
    id = sessionID.get();

    ++ids;

    //console.log(id);


    if( !generatedIDs.has( id ) )
    {
      generatedIDs.add( id );
    }
    else
    {
      console.error( 'Duplicate', id );
    }
  }

  setTimeout( generate, 300 );
}

generate()

//setInterval( generate, 1000 );
