import json
import os

def update_track_recite():
    try:
        # 定义教材文件目录
        textbook_dirs = [
            './data/wys-from1-textbook',
            './data/wys-from3-textbook'
        ]
        
        total_files_processed = 0
        total_tracks_modified = 0
        
        # 遍历每个目录
        for textbook_dir in textbook_dirs:
            # 确保目录存在
            if not os.path.exists(textbook_dir):
                print(f"目录不存在: {textbook_dir}")
                continue
                
            # 获取目录中的所有JSON文件
            json_files = [f for f in os.listdir(textbook_dir) if f.endswith('.json')]
            
            print(f"在 {textbook_dir} 中找到 {len(json_files)} 个JSON文件")
            
            # 遍历每个JSON文件
            for json_file in json_files:
                file_path = os.path.join(textbook_dir, json_file)
                
                # 读取JSON文件
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                # 记录修改数量
                modified_count = 0
                
                # 遍历所有页面
                for page in data:
                    # 遍历每个页面的track_info
                    if 'track_info' in page:
                        for track in page['track_info']:
                            # 检查条件
                            genre_condition = track.get('track_genre', '').find('听录音') != -1
                            text_condition = (
                                track.get('track_text', '').find('Unit 1') != -1
                                or track.get('track_text', '').find('Unit 2') != -1
                                or track.get('track_text', '').find('Unit 3') != -1
                                or track.get('track_text', '').find('Unit 4') != -1
                                or track.get('track_text', '').find('Unit 5') != -1
                                or track.get('track_text', '').find('Unit 6') != -1
                                or track.get('track_text', '').find('Unit 7') != -1
                                or track.get('track_text', '').find('Unit 8') != -1
                                or track.get('track_text', '').find('Unit 9') != -1
                                or track.get('track_text', '').find('Unit 10') != -1
                                or track.get('track_text', '').find('Activity 1') != -1
                                or track.get('track_text', '').find('Activity 2') != -1
                                or track.get('track_text', '').find('Activity 3') != -1
                                or track.get('track_text', '').find('Activity 4') != -1
                                or track.get('track_text', '').find('Activity 5') != -1
                                or track.get('track_text', '').find('Unit1') != -1
                                or track.get('track_text', '').find('Module') != -1
                            )                    
                            
                            # 如果满足任一条件，设置is_recite为0
                            if genre_condition or text_condition:
                                track['is_recite'] = 0
                                modified_count += 1
                
                # 只有当有修改时才保存文件
                if modified_count > 0:
                    # 保存修改后的文件
                    with open(file_path, 'w', encoding='utf-8') as f:
                        json.dump(data, f, ensure_ascii=False, indent=2)
                    
                    print(f"处理文件 {json_file}，修改了 {modified_count} 条记录")
                    total_tracks_modified += modified_count
                else:
                    print(f"处理文件 {json_file}，没有需要修改的记录")
                
                total_files_processed += 1
        
        print(f"处理完成！共处理了 {total_files_processed} 个文件，修改了 {total_tracks_modified} 条记录")
        
    except Exception as e:
        print(f"处理过程中发生错误: {str(e)}")

if __name__ == "__main__":
    update_track_recite() 