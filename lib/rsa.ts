import * as graphene from "graphene-pk11"
var RSA = graphene.RSA;
var Enums = graphene.Enums;

import * as alg from "./alg"
import * as iwc from "./iwebcrypto"
import {CryptoKey} from "./key"

let ALG_NAME_RSA_PKCS1 = "RSASSA-PKCS1-v1_5";
let ALG_NAME_RSA_PSS = "RSA-PSS";
let ALG_NAME_RSA_OAEP = "RSA-OAEP";

let HASH_ALGS = ["SHA-1", "SHA-224", "SHA-256", "SHA-384", "SHA-512"];

export class Rsa extends alg.AlgorithmBase {
	static ALGORITHM_NAME: string = "";
	static generateKey(session: graphene.Session, alg: any, extractable: boolean, keyUsages: string[], label?: string): iwc.ICryptoKeyPair {
		var size = alg.modulusLength;
		var exp = new Buffer(alg.publicExponent);
		var _key = session.generate("RSA", null, {
			"label": label,
			"token": true,
			"extractable": extractable,
			"keyUsages": keyUsages,
			"modulusLength": size,
			"publicExponent": exp
		});

		return {
			privateKey: new RsaKey(_key.privateKey, alg),
			publicKey: new RsaKey(_key.publicKey, alg)
		};
	}

	static checkRsaAlgorithm(alg: iwc.IAlgorithmIdentifier) {
		if (alg.name.toLowerCase() !== this.ALGORITHM_NAME.toLowerCase())
			throw new Error("RsaKeyGenParams: Wrong algrotiyhm name. Must be " + this.ALGORITHM_NAME);
	}

	static checkRsaGenParams(alg: IRsaKeyGenParams) {
		this.checkRsaAlgorithm;
		if (!alg.modulusLength)
			throw new TypeError("RsaKeyGenParams: modulusLength: Missing required property");
		if (alg.modulusLength < 256 || alg.modulusLength > 16384)
			throw new TypeError("RsaKeyGenParams: The modulus length must be a multiple of 8 bits and >= 256 and <= 16384");
		if (!(alg.publicExponent && alg.publicExponent instanceof Uint8Array))
			throw new TypeError("RsaKeyGenParams: publicExponent: Missing or not a Uint8Array");
	}

	static checkAlgorithmHashedParams(alg: iwc.IAlgorithmIdentifier) {
		super.checkAlgorithmHashedParams(alg);
		var _alg = alg.hash;
		_alg.name = _alg.name.toUpperCase();
		if (HASH_ALGS.indexOf(_alg.name) == -1)
			throw new Error("AlgorithmHashedParams: Unknow hash algorithm in use");
	}

	static wc2pk11(alg) {
		RsaPKCS1.checkRsaAlgorithm(alg);
		RsaPKCS1.checkAlgorithmHashedParams(alg);
		var _alg = null;
		switch (alg.hash.name.toUpperCase()) {
			case "SHA-1":
				_alg = "SHA1_RSA_PKCS";
				break;
			case "SHA-224":
				_alg = "SHA224_RSA_PKCS";
				break;
			case "SHA-256":
				_alg = "SHA256_RSA_PKCS";
				break;
			case "SHA-384":
				_alg = "SHA384_RSA_PKCS";
				break;
			case "SHA-512":
				_alg = "SHA512_RSA_PKCS";
				break;
			default:
				throw new TypeError("Unknown Hash agorithm name in use");
		}
		return _alg;
	}
}

export interface IRsaKeyGenParams extends iwc.IAlgorithmIdentifier {
	modulusLength: number;
	publicExponent: Uint8Array;
}

export class RsaKey extends CryptoKey {
	modulusLength: number;
	publicExponent: Uint8Array;

	constructor(key, alg: IRsaKeyGenParams) {
		super(key, alg);
		this.modulusLength = alg.modulusLength;
		this.publicExponent = alg.publicExponent;
		//TODO: get params from key if alg params is empty
	}
}

export class RsaPKCS1 extends Rsa {
	static ALGORITHM_NAME: string = ALG_NAME_RSA_PKCS1;

	static generateKey(session: graphene.Session, alg: IRsaKeyGenParams, extractable: boolean, keyUsages: string[], label?: string): iwc.ICryptoKeyPair {
		this.checkAlgorithmIdentifier(alg);
		this.checkRsaGenParams(alg);
		this.checkAlgorithmHashedParams(alg);

		var keyPair: iwc.ICryptoKeyPair = super.generateKey.apply(this, arguments);
		return keyPair;
	}

	static sign(session: graphene.Session, alg: iwc.IAlgorithmIdentifier, key: CryptoKey, data: Buffer) {
		RsaPKCS1.checkAlgorithmIdentifier(alg);
		RsaPKCS1.checkPrivateKey(key);
		var _alg = RsaPKCS1.wc2pk11(key.algorithm);

		var signer = session.createSign(_alg, key.key);
		signer.update(data);
		var signature = signer.final();
	}

	static verify(session: graphene.Session, alg: iwc.IAlgorithmIdentifier, key: CryptoKey, signature: Buffer, data: Buffer): boolean {
		RsaPKCS1.checkAlgorithmIdentifier(alg);
		RsaPKCS1.checkPublicKey(key);
		var _alg = RsaPKCS1.wc2pk11(key.algorithm);

		var signer = session.createVerify(_alg, key.key);
		signer.update(data);
		var res = signer.final(signature);
		return res;
	}

}

export class RsaPSS extends Rsa {
	static ALGORITHM_NAME: string = ALG_NAME_RSA_PSS;

	static generateKey(session: graphene.Session, alg: IRsaKeyGenParams, extractable: boolean, keyUsages: string[], label?: string): iwc.ICryptoKeyPair {
		throw new Error("not realized in this implementation");
	}
}

export class RsaOAEP extends Rsa {
	static ALGORITHM_NAME: string = ALG_NAME_RSA_OAEP;

	static generateKey(session: graphene.Session, alg: IRsaKeyGenParams, extractable: boolean, keyUsages: string[], label?: string): iwc.ICryptoKeyPair {
		this.checkAlgorithmIdentifier(alg);
		this.checkRsaGenParams(alg);
		this.checkAlgorithmHashedParams(alg);

		var keyPair: iwc.ICryptoKeyPair = super.generateKey.apply(arguments);
		return keyPair;
	}

	static wc2pk11(alg) {
		var params = null;
		switch (alg.hash.name.toUpperCase()) {
			case "SHA-1":
				params = new RSA.RsaOAEPParams(Enums.Mechanism.SHA1, Enums.MGF1.SHA1);
				break;
			case "SHA-224":
				params = new RSA.RsaOAEPParams(Enums.Mechanism.SHA224, Enums.MGF1.SHA224);
				break;
			case "SHA-256":
				params = new RSA.RsaOAEPParams(Enums.Mechanism.SHA256, Enums.MGF1.SHA256);
				break;
			case "SHA-384":
				params = new RSA.RsaOAEPParams(Enums.Mechanism.SHA384, Enums.MGF1.SHA384);
				break;
			case "SHA-512":
				params = new RSA.RsaOAEPParams(Enums.Mechanism.SHA512, Enums.MGF1.SHA512);
				break;
			default:
				throw new Error("Unknown hash name in use");
		}
		var res = { name: "RSA_PKCS_OAEP", params: params };
		return res;
	}

	static encrypt(session: graphene.Session, alg: iwc.IAlgorithmIdentifier, key: CryptoKey, data: Buffer): Buffer {
		RsaPKCS1.checkAlgorithmIdentifier(alg);
		RsaPKCS1.checkPublicKey(key);
		var _alg =RsaPKCS1.wc2pk11(key.algorithm); 

		var enc = session.createEncrypt(_alg, key.key);
		var msg = new Buffer(0);
		msg = Buffer.concat([msg, enc.update(data)]);
		msg = Buffer.concat([msg, enc.final()]);
		return msg;
	}

	static decrypt(session: graphene.Session, alg: iwc.IAlgorithmIdentifier, key: CryptoKey, data: Buffer): Buffer {
		RsaPKCS1.checkAlgorithmIdentifier(alg);
		RsaPKCS1.checkPrivateKey(key);
		var _alg =RsaPKCS1.wc2pk11(key.algorithm);

		var dec = session.createDecrypt(_alg, key.key);
		var msg = new Buffer(0);
		msg = Buffer.concat([msg, dec.update(data)]);
		msg = Buffer.concat([msg, dec.final()]);
		return msg;
	}
}