"""Zarinpal payment gateway integration."""
import requests
from django.conf import settings


def request_payment(amount: int, description: str, callback_url: str, email: str = '', mobile: str = '') -> dict:
    """
    Request a payment from Zarinpal.
    Returns: {'authority': '...', 'pay_url': '...'} on success or {'error': '...'} on failure.
    """
    data = {
        'merchant_id': settings.ZARINPAL_MERCHANT_ID,
        'amount': amount,
        'description': description,
        'callback_url': callback_url,
    }
    if email:
        data['metadata'] = {'email': email}
    if mobile:
        data.setdefault('metadata', {})['mobile'] = mobile

    try:
        resp = requests.post(
            settings.ZARINPAL_BASE_URL + 'request.json',
            json=data,
            timeout=10,
        )
        resp.raise_for_status()
        result = resp.json()
        if result.get('data', {}).get('code') == 100:
            authority = result['data']['authority']
            pay_url = settings.ZARINPAL_START_URL + authority
            return {'authority': authority, 'pay_url': pay_url}
        return {'error': result.get('errors', {}).get('message', 'خطا در اتصال به درگاه پرداخت')}
    except Exception as e:
        return {'error': str(e)}


def verify_payment(amount: int, authority: str) -> dict:
    """
    Verify a payment after user returns from Zarinpal.
    Returns: {'ref_id': '...'} on success or {'error': '...'} on failure.
    """
    data = {
        'merchant_id': settings.ZARINPAL_MERCHANT_ID,
        'amount': amount,
        'authority': authority,
    }
    try:
        resp = requests.post(
            settings.ZARINPAL_BASE_URL + 'verify.json',
            json=data,
            timeout=10,
        )
        resp.raise_for_status()
        result = resp.json()
        code = result.get('data', {}).get('code')
        if code in (100, 101):  # 101 = already verified
            ref_id = str(result['data'].get('ref_id', ''))
            return {'ref_id': ref_id}
        return {'error': result.get('errors', {}).get('message', 'پرداخت تایید نشد')}
    except Exception as e:
        return {'error': str(e)}
