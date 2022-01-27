import boto3
import os
import uuid
from urllib.parse import unquote_plus
from PIL import Image

s3_client = boto3.client('s3')

def resize_image(picture_file_path, crop_dimensions=None):
    # get the profile pics store ready
    image = Image.open(picture_file_path)
    if crop_dimensions:
        image = image.crop(crop_dimensions)

    # TODO: make this configurable
    image = image.resize((300, 300))

    # save and convert to jpg here
    cropped_filename = os.path.join(os.path.dirname(picture_file_path), "{}_cropped.jpg".format(picture_file_path))
    thumbnail_filename = os.path.join(os.path.dirname(picture_file_path), "{}_thumbnail.jpg".format(picture_file_path))
    image.save(cropped_filename)
    image = image.resize((128, 128))
    image.save(thumbnail_filename)
    return (cropped_filename, thumbnail_filename)

def handler(event, context):
  amplify_storage_bucket_name = os.environ.get('AMPLIFY_STORAGE_BUCKET_NAME')
  print(os.environ)
  for record in event['Records']:
      bucket = record['s3']['bucket']['name']
      key = unquote_plus(record['s3']['object']['key'])
      tmpkey = key.replace('/', '')
      download_path = '/tmp/{}{}'.format(uuid.uuid4(), tmpkey)
      print('Downloading {} from bucket {} to {}'.format(key, bucket, download_path))
      s3_client.download_file(bucket, key, download_path)
      (newImage, thumbnail) = resize_image(download_path)
      base_key = key.split('.')[0]
      s3_client.upload_file(newImage, amplify_storage_bucket_name, key)
      s3_client.upload_file(thumbnail, amplify_storage_bucket_name, "{}_thumbnail.jpg".format(base_key))
      s3_client.delete_object(Bucket=bucket, Key=key)
