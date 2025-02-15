import requests

from app.scripts.utils.AuthV3Util import addAuthParams

# 您的应用ID
APP_KEY = '04ad5eab0788f476'
# 您的应用密钥
APP_SECRET = 'Kqzi2Guz8qaROD1Hpv4mWfqfoLp3JNXO'


def createRequest():
    '''
    note: 将下列变量替换为需要请求的参数
    '''
    q = '待翻译文本'
    lang_from = 'zh-CHS'
    lang_to = 'en'

    data = {'q': q, 'from': lang_from, 'to': lang_to}

    addAuthParams(APP_KEY, APP_SECRET, data)

    header = {'Content-Type': 'application/x-www-form-urlencoded'}
    res = doCall('https://openapi.youdao.com/api', header, data, 'post')
    print(str(res.content, 'utf-8'))


def doCall(url, header, params, method):
    if 'get' == method:
        return requests.get(url, params)
    elif 'post' == method:
        return requests.post(url, params, header)

# 网易有道智云翻译服务api调用demo
# api接口: https://openapi.youdao.com/api
if __name__ == '__main__':
    createRequest()
