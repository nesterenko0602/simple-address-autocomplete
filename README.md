# Simple address autocomplete
#### Dependencies
None. Only Vanilla.
#### Example of usage
```sh
new AddressComplete({
    selector: '#autocomplete',
    streetUrl: 'http://vpn.somto.grcc.team/fias_search/ao_autocomplete',
    houseUrl: 'http://vpn.somto.grcc.team/fias_search/house_autocomplete',
    minChars: 3,
    onChangeHouse: function(result) {
      console.log(result);
    },
    onChangeStreet: function(result) {
      console.log(result);
    }
})
```