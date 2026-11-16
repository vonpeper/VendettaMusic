import { test, describe } from "node:test"
import assert from "node:assert/strict"
import { computeCanonicalFinancials } from "./events-sync"

describe("Motor Canónico de Sincronización Financiera (events-sync.ts)", () => {
  test("debe calcular subtotal y saldo correctamente con valores estándar", () => {
    const res = computeCanonicalFinancials({
      baseAmount: 10000,
      viaticosAmount: 1500,
      discountAmount: 500,
      additionalItemsTotal: 1000,
      invoice: false,
      depositAmount: 4000,
    })

    assert.equal(res.subtotal, 12000)
    assert.equal(res.ivaAmount, 0)
    assert.equal(res.totalWithTax, 12000)
    assert.equal(res.deposit, 4000)
    assert.equal(res.balance, 8000)
  })

  test("debe respetar estrictamente anticipo de $0 sin sobreescribirlo con 50%", () => {
    const res = computeCanonicalFinancials({
      baseAmount: 6500,
      viaticosAmount: 0,
      invoice: false,
      depositAmount: 0,
    })

    assert.equal(res.subtotal, 6500)
    assert.equal(res.totalWithTax, 6500)
    assert.equal(res.deposit, 0)
    assert.equal(res.balance, 6500)
  })

  test("debe calcular IVA del 16% cuando invoice es true y respetar anticipo", () => {
    const res = computeCanonicalFinancials({
      baseAmount: 10000,
      viaticosAmount: 2000,
      invoice: true,
      depositAmount: 5000,
    })

    assert.equal(res.subtotal, 12000)
    assert.equal(res.ivaAmount, 1920)
    assert.equal(res.totalWithTax, 13920)
    assert.equal(res.deposit, 5000)
    assert.equal(res.balance, 8920)
  })

  test("no debe permitir saldos negativos si el anticipo supera el total", () => {
    const res = computeCanonicalFinancials({
      baseAmount: 5000,
      depositAmount: 6000,
    })

    assert.equal(res.subtotal, 5000)
    assert.equal(res.totalWithTax, 5000)
    assert.equal(res.deposit, 6000)
    assert.equal(res.balance, 0)
  })

  test("debe manejar valores nulos o indefinidos de manera segura", () => {
    const res = computeCanonicalFinancials({
      baseAmount: 8500,
      viaticosAmount: undefined,
      discountAmount: undefined,
      additionalItemsTotal: undefined,
      depositAmount: undefined,
    })

    assert.equal(res.baseAmount, 8500)
    assert.equal(res.viaticosAmount, 0)
    assert.equal(res.discountAmount, 0)
    assert.equal(res.additionalItemsTotal, 0)
    assert.equal(res.subtotal, 8500)
    assert.equal(res.deposit, 0)
    assert.equal(res.balance, 8500)
  })
})
