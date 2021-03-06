
/* A JavaScript implementation of the Secure Hash Algorithm, HMAC-SHA-1, as defined in FIPS PUB 180-1
*	-----
*	Everything below this point to just logic to implement the hash.
*/

function sha1(input)
{
	/* bits per input character. Assume ASCII or UTF8 */
	var character_size = 8;
	return binb2hex(core_sha1(str2binb(input, character_size), input.length * character_size));
}

function hmac_sha1(key, data)
{
	/* bits per input character. Assume ASCII or UTF8 */
	var character_size = 8;
	var bkey = str2binb(key, character_size);
	if (bkey.length > 16) bkey = core_sha1(bkey, key.length * character_size);
 
	var ipad = Array(16), opad = Array(16);
	for (var i = 0; i < 16; i++) { ipad[i] = bkey[i] ^ 0x36363636; opad[i] = bkey[i] ^ 0x5C5C5C5C; }
 
	var hash = core_sha1(ipad.concat(str2binb(data, character_size)), 512 + data.length * character_size);
	return binb2hex(core_sha1(opad.concat(hash), 512 + 160));
}

/* Convert an 8-bit or 16-bit string to an array of big-endian words In 8-bit function, characters >255 have their hi-byte silently ignored. */
function str2binb(str, character_size)
{
	var bin = Array();
	var mask = (1 << character_size) - 1;
	for (var i = 0; i < str.length * character_size; i += character_size)
	bin[i >> 5] |= (str.charCodeAt(i / character_size) & mask) << (24 - i % 32);
	return bin;
}

/* Calculate the SHA-1 of an array of big-endian words, and a bit length */
function core_sha1(x, len)
{
	/* Pad the input to have 8 bits and be a multiple of 512. */
	x[len >> 5] |= 0x80 << (24 - len % 32);
	x[((len + 64 >> 9) << 4) + 15] = len;
 
	var w = Array(80);
	var hash = [1732584193, -271733879, -1732584194, 271733878, -1009589776]
	var constants = [1518500249, 1859775393 , -1894007588, -899497514]
	for (var i = 0; i < x.length; i += 16) {
		var a = hash[0];
		var b = hash[1];
		var c = hash[2];
		var d = hash[3];
		var e = hash[4];
 
		for (var j = 0; j < 80; j++) 
		{
			w[j] = j < 16 ? x[i + j] : rol(w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16], 1);
			var t = add_32(rol(a, 5), sha_func(j, b, c, d), e, w[j], constants[(j/20)>>0]);
			e = d;
			d = c;
			c = rol(b, 30);
			b = a;
			a = t;
		}
 
		hash[0] = (hash[0] + a) & 0xFFFFFFFF;
		hash[1] = (hash[1] + b) & 0xFFFFFFFF;
		hash[2] = (hash[2] + c) & 0xFFFFFFFF;
		hash[3] = (hash[3] + d) & 0xFFFFFFFF;
		hash[4] = (hash[4] + e) & 0xFFFFFFFF;
	}
	return hash;
}

/* Javascript by default does 64 bit addition, but we actually want to do 32bit signed addition (wrap overflow around rather than create a 64bit number)*/
function add_32(v, w, x, y, z)
{
	var lsw = (v & 0xFFFF) + (w & 0xFFFF) + (x & 0xFFFF) + (y & 0xFFFF) + (z & 0xFFFF);
	var msw = (v >>> 16) + (w >>> 16) + (x >>> 16) + (y >>> 16) + (z >>> 16) + (lsw >>> 16);
	return ((msw & 0xFFFF) << 16) | (lsw & 0xFFFF);
}

function sha_func(iter, x, y, z)
{
	if (iter < 20) return (x & y) | ((~x) & z);
	if (iter < 40) return x ^ y ^ z;
	if (iter < 60) return (x & y) | (x & z) | (y & z);
	return x ^ y ^ z;
}

/* Rotate left */
function rol(num, cnt) { return (num << cnt) | (num >>> (32 - cnt)); }
 
/* Convert an array of big-endian words to a hex string. */
function binb2hex(binarray)
{
	var hex_tab = "0123456789abcdef";
	var str = "";
	for (var i = 0; i < binarray.length * 4; i++) 
	{
		var sft = (3 - i % 4) * 8;
		str += hex_tab.charAt((binarray[i >> 2] >> (sft + 4)) & 0xF) + hex_tab.charAt((binarray[i >> 2] >> sft) & 0xF);
	}
	return str;
}

/* Validation */
function validate()
{
	return sha1("") == "da39a3ee5e6b4b0d3255bfef95601890afd80709"
		&& sha1("The quick brown fox jumps over the lazy dog") == "2fd4e1c67a2d28fced849ee1bb76e7391b93eb12"
		&& sha1("abc") == "a9993e364706816aba3e25717850c26c9cd0d89d"
		&& hmac_sha1("key", "The quick brown fox jumps over the lazy dog") == "de7c9b85b8b78aa6bc8a7a36f70a90701c9db4d9"
		&& hmac_sha1("", "abc") == "9b4a918f398d74d3e367970aba3cbe54e4d2b5d9"
		&& hmac_sha1("", "") == "fbdb1d1b18aa6c08324b7d64b71fb76370690e1d";
}

var module = angular.module('MainApp', []);
module.controller('mainController', ['$scope', '$location', function($scope, $location) {
	$scope.Password = null;
	$scope.Question = null;
	$scope.Answer = null;
	$scope.GenerateClick = () => {
		if(!validate()) {
			alert('Validation of HMAC formula failed.');
			return;
		}
		if(!$scope.Password || !$scope.Question) {
			alert('Question and Password must be filled out.');
			return;
		}
		var answer = hmac_sha1($scope.Password, $scope.Question.toLowerCase().replace(/[^a-zA-Z]/g, ""));
		console.log($scope.Question, $scope.Password, answer);
		$scope.Answer = answer;
	}
}]);
var mainApp = document.getElementById('MainApp');
angular.element(mainApp).ready(() => {
	angular.bootstrap(mainApp, ['MainApp'])
});
