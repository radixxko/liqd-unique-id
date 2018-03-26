'use strict';

module.exports = () =>
{
  return new Promise( resolve =>
  {
    let id = Math.floor( Math.random() * Number.MAX_SAFE_INTEGER ).toString();

    switch( process.platform )
    {
      case 'win32': return require('child_process').exec( ( process.arch === 'ia32' && process.env.hasOwnProperty('PROCESSOR_ARCHITEW6432') ? '%windir%\\sysnative\\cmd.exe /c ' : '' ) + '%windir%\\System32\\REG QUERY HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Cryptography /v MachineGuid', ( error, stdout, stderr ) =>
      {
        if( !error ) try
        {
          id = stdout.split('REG_SZ')[1].replace(/\r+|\n+|\s+/ig, '');
        }
        catch(e){}

        resolve( id );
      });

      case 'darwin': return require('child_process').exec('ioreg -rd1 -c IOPlatformExpertDevice', ( error, stdout, stderr ) =>
      {
        if( !error ) try
        {
          id = stdout.split('IOPlatformUUID')[1].split('\n')[0].replace(/\=|\s+|\"/ig, '');
        }
        catch(e){}

        resolve( id );
      });

      case 'linux': return require('child_process').exec('( cat /var/lib/dbus/machine-id /etc/machine-id 2> /dev/null || hostname ) | head -n 1 || :', ( error, stdout, stderr ) =>
      {
        if( !error ) try
        {
          id = stdout.replace(/\r+|\n+|\s+/ig, '');
        }
        catch(e){}

        resolve( id );
      });

      case 'freebsd': return require('child_process').exec('kenv -q smbios.system.uuid', ( error, stdout, stderr ) =>
      {
        if( !error ) try
        {
          id = stdout.replace(/\r+|\n+|\s+/ig, '');
        }
        catch(e){}

        resolve( id );
      });

      default: return resolve( id );
    }
  });
}
