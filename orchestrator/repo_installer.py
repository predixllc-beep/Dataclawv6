import subprocess,os
def install_repo(repo_url):
    repo_name=repo_url.split('/')[-1].replace('.git','')
    os.makedirs('/opt/pouls/plugins',exist_ok=True)
    subprocess.run(['git','clone',repo_url,f'/opt/pouls/plugins/{repo_name}'],check=False)
    return {'installed':True,'agent':repo_name}
