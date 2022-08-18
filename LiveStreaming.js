import React, { Component } from 'react';
import { Animated, Image, ImageBackground, ScrollView, StatusBar, StyleSheet, Modal, Text, View, Dimensions, ToastAndroid, ActivityIndicator, PermissionsAndroid, SafeAreaView, TextInput, BackHandler } from 'react-native';
import { TouchableOpacity } from 'react-native';
import Helper from '../../../assets/Helper';
import RBSheet from "react-native-raw-bottom-sheet";
import Ionicons from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import AsyncStorage from '@react-native-async-storage/async-storage';
import firestore from '@react-native-firebase/firestore';
import Video from 'react-native-video';
import convertToProxyURL from 'react-native-video-cache';
import Clipboard from '@react-native-clipboard/clipboard';
import * as solanaWeb3 from "@solana/web3.js";
import axios from 'axios';
import moment from 'moment';
import { NodeCameraView, NodePlayerView } from 'react-native-nodemediaclient';
import { WheelPicker } from "react-native-wheel-picker-android";
import LottieView from 'lottie-react-native';
import { BlurView as Blur_View } from "@react-native-community/blur";
import password from 'secure-random-password';

const helper = new Helper();
const sfFont = "FontsFree-Net-SFProDisplay-Regular";
const { width } = Dimensions.get('screen');

// For Comments
const userImageSize = 60;
const spacing = 0.5;
const marginBottom = 1;
const ITEM_SIZE = userImageSize + spacing * 4 + marginBottom;

const wheelPickerData = [
    "0.10 SOL",
    "0.25 SOL",
    "0.50 SOL",
    "0.75 SOL",
    "1.00 SOL",
];

const connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl("mainnet-beta"));
const LAMPORTS_PER_SOL = solanaWeb3.LAMPORTS_PER_SOL;
const streaming_API_Token = ""



export default class GoLive extends Component {
    constructor(props) {
        super(props);
        this.state = {
            comment: "",
            comments: [],
            scrollY: new Animated.Value(0),
            isLive: false,
            modalVisible: false,
            selected_SolValue: 0,
            solana: "",
            playbackId: this.props.route.params.playbackId,
            streamId: this.props.route.params.streamId,
            MyUserName: this.props.route.params.myUsername,
            streamer_UserName: this.props.route.params.streamer_UserName,
            My_Profile_Img: this.props.route.params.My_Profile_Img,
            isBacked: false,
            wallet_Address: "",
            wallet_Key: "",
            solanaBalance: "",
            views:[]
        };
    }




    componentDidMount() {
        console.log(this.state.streamer_UserName)
        console.log(this.state.MyUserName)

        this.addView()

        this.requestCameraPermission()

        this.callCommentFunction()

        this.streamingExist();

        return 0;
    }


    callCommentFunction = () => {
        // setInterval(() => {
        //     this.getComments();
        //     this.getViews();
        // }, 4000);

        return null;
    }


    setCameraRef = (ref) => {
        this.nodeCameraViewRef = ref;
    };


    onSolValueSelected = selected_SolValue => {
        this.setState({ selected_SolValue });

        console.log(selected_SolValue)
    };



    solValue_Function = () => {
        if (this.state.selected_SolValue == 0) {
            this.setState({ solana: "0.10" });
            // this.RBSheet_Age.close()
        }
        else if (this.state.selected_SolValue == 1) {
            this.setState({ solana: "0.25" });
            // this.RBSheet_Age.close()
        }
        else if (this.state.selected_SolValue == 2) {
            this.setState({ solana: "0.50" });
            // this.RBSheet_Age.close()
        }
        else if (this.state.selected_SolValue == 3) {
            this.setState({ solana: "0.75" });
            // this.RBSheet_Age.close()
        }
        else if (this.state.selected_SolValue == 4) {
            this.setState({ solana: "1.00" });
            // this.RBSheet_Age.close()
        }
    }




    // checkSolanaBalance = async () => {

    //     // Getting Solana Balance
    //     const add = new solanaWeb3.PublicKey(this.state.wallet_Address)
    //     const lamports = await connection.getBalance(add)
    //         .then((val) => {

    //             const balance = val / LAMPORTS_PER_SOL
    //             console.log("===============================================", balance)

    //             this.setState({ solanaBalance: balance })
    //         })
    //         .catch((err) => {
    //             console.error(`Error: ${err}`);
    //         });

    //     const sol = lamports / LAMPORTS_PER_SOL
    //     return sol;
    // }




    // sendTip = async (from, to, amount) => {
    //     const account = accountFromSeed(from.seed);

    //     console.log("Executing transaction...");
    //     console.log(amount);

    //     const transaction = new solanaWeb3.Transaction().add(
    //         solanaWeb3.SystemProgram.transfer({
    //             fromPubkey: publicKeyFromString(from.account),
    //             toPubkey: publicKeyFromString(to),
    //             lamports: amount * LAMPORTS_PER_SOL,
    //         })
    //     );

    //     // Sign transaction, broadcast, and confirm
    //     const connection = createConnection();
    //     const signature = await solanaWeb3.sendAndConfirmTransaction(
    //         connection,
    //         transaction,
    //         [account]
    //     );
    //     console.log("SIGNATURE", signature);
    // };



    sendTip = () => {
        this.solValue_Function()

        setTimeout(() => {
            const tip = "Send " + this.state.solana+" SOL"
            this.setState({
                comment: tip
            })
            this.RBSheet_Tip.close()
            this.send_Comment_ToFirebase()
        }, 1000);

    }


    
    addView=()=>{
        firestore()
            .collection("Accounts")
            .doc(this.state.streamer_UserName)
            .collection("Streamings")
            .doc("Streaming")
            .update({
                Views: firestore.FieldValue.arrayUnion(this.state.MyUserName)
            })
    }


    getViews=()=>{
        firestore()
            .collection("Accounts")
            .doc(this.state.streamer_UserName)
            .collection("Streamings")
            .doc("Streaming")
            .get()
            .then((query) => {
                this.setState({
                    views: query.data().Views
                })
            })
                    // .onSnapshot(onSnapshot=>{
                    //     // console.log("===+",onSnapshot.data().Views)
                    //     this.setState({
                    //         views: onSnapshot.data().Views
                    //     })
                    // })
    }


    streamingExist=()=>{
        firestore()
        .collection("Accounts")
        .doc(this.state.streamer_UserName)
        .collection("Streamings")
        .doc("Streaming")
        .onSnapshot(doc=>{
            if( doc.exists == true){
                this.getComments();
                this.getViews();
            }
            else if (doc.exists == false) {
                this.props.navigation.goBack()
            }
        })
    }




    send_Comment_ToFirebase = () => {

        const randomID = password.randomPassword({ length: 10, characters: [password.lower, password.upper, password.digits] })

        if (this.state.comment == "") {
            return null;
        }
        else {
            firestore()
                .collection("Accounts")
                .doc(this.state.streamer_UserName)
                .collection("Streamings")
                .doc("Streaming")
                .update({
                    Comments: firestore.FieldValue.arrayUnion(
                        {
                            id: randomID,
                            profile_Img: this.state.My_Profile_Img,
                            userName: this.state.MyUserName,
                            comment: this.state.comment,
                        }
                    )
                })
                .then(() => {
                    this.setState({ comment: "" }),
                        this.getComments()
                })
        }
    }




    getComments = () => {
        const getComments = firestore()
            .collection("Accounts")
            .doc(this.state.streamer_UserName)
            .collection("Streamings")
            .doc("Streaming")
            .get()
            .then((querySnapshot) => {
                // console.log("]]]]]]]]]]]]]]]]]]]", querySnapshot.data())
                const comments = querySnapshot.data().Comments
                this.setState({
                    comments: comments
                })
                this.scrollToEnd()
            })

        return getComments;
    }




    scrollToEnd = () => {
        this.flatlistRef.scrollToEnd({ animating: true })
    }


    requestCameraPermission = async () => {
        try {
            const granted = await PermissionsAndroid.requestMultiple(
                [PermissionsAndroid.PERMISSIONS.CAMERA, PermissionsAndroid.PERMISSIONS.RECORD_AUDIO],
                {
                    title: 'Fiyer need Camera And Microphone Permission',
                    message:
                        'Fiyer needs access to your camera so you can take awesome pictures.',
                    buttonNeutral: 'Ask Me Later',
                    buttonNegative: 'Cancel',
                    buttonPositive: 'OK',
                }
            );
            if (
                granted['android.permission.CAMERA'] === PermissionsAndroid.RESULTS.GRANTED &&
                granted['android.permission.RECORD_AUDIO'] === PermissionsAndroid.RESULTS.GRANTED
            ) {
                if (this.nodeCameraViewRef) this.nodeCameraViewRef.startPreview();
            } else {
                Logger.log('Camera permission denied');
            }
        } catch (err) {
            Logger.warn(err);
        }
    };



    setModalVisible = (visible) => {
        this.setState({ modalVisible: visible });
    }



    render() {
        const {
            scrollY,
            streamKey,
            modalVisible,
            playbackId,
            comments,
        } = this.state;

        return (
            <SafeAreaView style={{ ...styles.container }}>
                <StatusBar backgroundColor={"transparent"} translucent />

                {/* Camera for streaming */}
                <NodePlayerView
                    style={{ flex: 1, height: "100%", width: '100%', backgroundColor: 'black', position: "absolute" }}
                    ref={this.playerRef}
                    inputUrl={`https://livepeercdn.com/hls/${playbackId}/index.m3u8`}
                    scaleMode={'ScaleAspectFit'}
                    bufferTime={300}
                    maxBufferTime={1000}
                    autoplay={true}
                />

                {/* Header View */}
                <View style={{ ...styles.headerView }}>

                    {/* live status and Views */}
                    <View style={{ ...styles.headerInnerViews }}>
                        {/* Live status */}
                        <View style={{ ...styles.headerTabs, width: "25%", marginRight: 5, backgroundColor: "#FFFFFF77", }}>
                            <View style={{ ...styles.dot, backgroundColor: "#FFFFFF" }} />
                            <Text style={{ ...styles.headerText }}>{"Live"}</Text>
                        </View>
                        {/* Views */}
                        <View style={{ ...styles.headerTabs }}>
                            <Ionicons name={"eye"} size={12} color={"#ffffff"} />
                            <Text style={{ ...styles.headerText, color: "#ffffff" }}>{this.state.views.length}</Text>
                        </View>
                    </View>
                </View>

                {/* Comments View */}
                <View style={{ ...styles.commentsView }}>
                    {/* FlatList */}
                    <Animated.FlatList
                        onScroll={
                            Animated.event(
                                [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                                { useNativeDriver: true }
                            )
                        }
                        data={comments}
                        // ref={this.flatlistRef}
                        ref={ref => {
                            this.flatlistRef = ref;
                        }}
                        keyExtractor={(item, index) => item + index}
                        contentContainerStyle={{ paddingBottom: 20 }}
                        renderItem={({ item, index }) => {

                            const inputRange = [
                                -1,
                                0,
                                ITEM_SIZE * index,
                                ITEM_SIZE * (index + 2),
                            ]
                            const scale = scrollY.interpolate({
                                inputRange,
                                outputRange: [1, 1, 1, 0]
                            })

                            const OpacityInputRange = [
                                -40,
                                0,
                                ITEM_SIZE * index,
                                ITEM_SIZE * (index + .7),
                            ]
                            const opacity = scrollY.interpolate({
                                inputRange: OpacityInputRange,
                                outputRange: [1, 1, 1, 0]
                            })
                            return (
                                // Comments Animated View
                                <Animated.View style={{
                                    width: "100%",
                                    height: 60,
                                    marginTop: 5,
                                    flexDirection: "row",
                                    alignItems: 'center',
                                    transform: [{ scale }], opacity,
                                }}>
                                    {/* Profile */}
                                    <View style={{ width: "20%", alignItems: 'center', }}>
                                        <View>
                                            <Image source={{ uri: item.profile_Img }}
                                                style={{ ...styles.user_Image }}
                                            />
                                        </View>
                                    </View>
                                    {/* Name & Comment */}
                                    <View style={{ width: "80%" }}>
                                        <Text style={{ ...styles.user_Details }} numberOfLines={1}>{item.userName}</Text>
                                        <Text style={{ ...styles.user_Details, fontSize: 10, width: "90%" }} numberOfLines={3} >{item.comment}</Text>
                                    </View>
                                </Animated.View>
                            )
                        }}
                    />
                </View>

                {/* Footer View */}
                <View style={{ ...styles.footerView }}>
                    {/* Comment TextInput */}
                    <View style={{ width: "88%" }}>
                        <TextInput
                            style={{ ...styles.TextInputStyle }}
                            onChangeText={(value) => this.setState({ comment: value })}
                            value={this.state.comment}
                            placeholder={"Comment..."}
                            placeholderTextColor={"#D1D1D1"}
                        />
                        <TouchableOpacity style={{
                            position: "absolute",
                            right: 0,
                            top: 10,
                        }}
                            onPress={() => { this.send_Comment_ToFirebase() }}
                        >
                            <Text style={{ ...styles.footerText }}>Send</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Send Gift */}
                    <TouchableOpacity
                        onPress={() => { this.RBSheet_Tip.open() }}
                        style={{
                            backgroundColor: "#ffffff",
                            width: 40,
                            height: 40,
                            borderRadius: 4,
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    >
                        <Image
                            source={require("../../../icons/solana.png")}
                            style={{ ...styles.giftIcon }}
                        />
                    </TouchableOpacity>
                    {console.log("==========>", this.state.solana)}
                </View>

                {/* Give a tip sheet */}
                <RBSheet
                    ref={ref => {
                        this.RBSheet_Tip = ref;
                    }}
                    animationType={'slide'}
                    height={320}
                    openDuration={250}
                    closeDuration={250}
                    // closeOnDragDown={true}
                    customStyles={{
                        container: {
                            borderTopEndRadius: 15,
                            borderTopStartRadius: 15,
                            backgroundColor: "#000000",
                        },
                        wrapper: {
                            backgroundColor: "#00000000",
                        },
                        draggableIcon: {
                            backgroundColor: "#ffffff"
                        }
                    }}
                >
                    <SafeAreaView style={{
                        width: "100%",
                        height: "100%",
                        justifyContent: "space-evenly",
                        alignItems: 'center',
                    }}>
                        {/* Solana logo */}
                        <View style={{
                            width: 32,
                            height: 32,
                            borderWidth: 0.7,
                            borderRadius: 100,
                            borderColor: "#ffffff",
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}>
                            <Image
                                source={require("../../../icons/solana.png")}
                                style={{
                                    width: 18,
                                    height: 18,
                                }}
                            />
                        </View>

                        {/* Sol Wheel Picker */}
                        <WheelPicker
                            selectedItem={this.state.selected_SolValue}
                            data={wheelPickerData}
                            onItemSelected={this.onSolValueSelected}
                            isCyclic={true}
                            selectedItemTextColor={"#FFFFFF"}
                            itemTextColor={"#797979"}
                            indicatorColor={"#000000"}
                            selectedItemTextSize={20}
                            itemTextSize={18}
                            selectedItemTextFontFamily={sfFont}
                        >
                        </WheelPicker>

                        <View style={{ ...styles.sheet_arrowStyle }} >
                            <AntDesign name={"right"} size={18} color={"#ffffff"} />
                        </View>

                        {/* Tip Btn */}
                        <TouchableOpacity style={{
                            width: "35%",
                            height: 35,
                            backgroundColor: "#ffffff",
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderRadius: 4,
                        }}
                            onPress={() => { this.sendTip()}}
                        >
                            <Text style={{
                                fontFamily: sfFont,
                                fontSize: 17,
                                color: "#000000",
                            }}>Give a tip</Text>
                        </TouchableOpacity>

                    </SafeAreaView>
                </RBSheet>


                {/* Modal for back btn */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={modalVisible}
                    statusBarTranslucent={true}
                    onRequestClose={() => {
                        this.setModalVisible(!modalVisible);
                    }}
                >

                    {/* Centerd View */}
                    <View style={{
                        flex: 1,
                        justifyContent: "center",
                        alignItems: 'center',
                        backgroundColor: "#00000000",
                    }}>

                        <View style={{
                            backgroundColor: "#000000",
                            width: "85%",
                            height: 200,
                            borderRadius: 10,
                            overflow: "hidden",
                            borderWidth: 1,
                            borderColor: "#fff",
                        }}>
                            {/* Cross icon View */}
                            <View style={{
                                width: "95%",
                                alignSelf: 'center',
                                alignItems: "flex-end",
                                marginTop: 8,
                            }}>
                                <TouchableOpacity
                                    onPress={() => { this.setModalVisible(!modalVisible) }}
                                >
                                    <LottieView
                                        ref={animation => {
                                            this.animation = animation;
                                        }}
                                        source={require('../../Json/cross2.json')}
                                        autoPlay={true}
                                        loop={true}
                                        duration={2000}
                                        style={{
                                            width: 25,
                                            height: 25,
                                        }}
                                    />
                                </TouchableOpacity>
                            </View>


                            <Text style={{
                                alignSelf: 'center',
                                textAlign: "center",
                                marginTop: 35,
                                fontFamily: sfFont,
                                fontSize: 16,
                                color: "#ffffff",
                            }}>Are you sure you want to exit?</Text>


                            {/* Create stream Btn */}
                            <View style={{ width: "70%", alignSelf: "center", marginTop: 40, }}>
                                {this.state.isBacked &&
                                    <View style={{
                                        width: "90%",
                                        height: 37,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        alignSelf: 'center',
                                    }}>
                                        <ActivityIndicator size="small" color={"#FFFFFF"} />
                                    </View>
                                }
                                {/* block Btn */}
                                {!this.state.isBacked &&
                                    <TouchableOpacity style={{
                                        width: "50%",
                                        height: 37,
                                        backgroundColor: "#FFFFFF",
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        borderRadius: 4,
                                        alignSelf: 'center',
                                    }}
                                        onPress={() => { this.props.navigation.goBack() }}
                                    >
                                        <Text style={{
                                            fontFamily: sfFont,
                                            fontSize: 14,
                                            color: "#000000",
                                        }}>Yes</Text>
                                    </TouchableOpacity>}
                            </View>


                            {/* Blur View */}
                            {/* <Blur_View
                                style={{
                                    position: "absolute",
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    top: 0,
                                    zIndex: -1,
                                }}
                                blurType="dark"
                                blurAmount={30}
                                reducedTransparencyFallbackColor="white"
                            ></Blur_View> */}
                        </View>

                    </View>
                </Modal>


            </SafeAreaView>
        );
    }
}





const styles = StyleSheet.create({
    container: {
        width: "100%",
        height: "100%",
        backgroundColor: "#020202",
    },
    headerView: {
        width: "92%",
        alignSelf: 'center',
        marginTop: "14%",
        flexDirection: "row",
        justifyContent: "flex-end",
        alignItems: 'center',
    },
    headerInnerViews: {
        width: "50%",
        flexDirection: "row",
        justifyContent: "flex-end",
        alignItems: 'center',
    },
    headerTabs: {
        width: "30%",
        height: 20,
        backgroundColor: "#0000006B",
        borderRadius: 4,
        flexDirection: "row",
        justifyContent: "space-evenly",
        alignItems: 'center',
    },
    headerButtons: {
        width: "45%",
        height: 25,
        backgroundColor: "#ffffff",
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerText: {
        fontFamily: sfFont,
        fontSize: 11,
        color: "#000000",
        bottom: 1,
    },
    dot: {
        width: 7,
        height: 7,
        borderRadius: 50,
    },
    footerView: {
        width: "92%",
        alignSelf: 'center',
        position: "absolute",
        bottom: 10,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: 'center',
    },
    giftIcon: {
        width: 28,
        height: 28,
        // tintColor: "#ffffff",
    },
    TextInputStyle: {
        width: "97%",
        height: 40,
        borderWidth: 0.5,
        borderColor: "#FFFFFF",
        borderRadius: 4,
        alignSelf: "center",
        color: "#FFFFFF",
        fontFamily: sfFont,
        paddingRight: 50,
        paddingLeft: 10,
    },
    footerText: {
        fontFamily: sfFont,
        fontSize: 14,
        color: "#ffffff",
        marginRight: 10,
    },
    user_Image: {
        width: 45,
        height: 45,
        borderRadius: 100,
        borderWidth: 1,
        borderColor: "#ffffff",
    },
    user_Details: {
        fontFamily: sfFont,
        fontSize: 14,
        color: "#ffffff",
        width: "100%",
    },
    commentsView: {
        width: "90%",
        height: 250,
        alignSelf: 'center',
        position: "absolute",
        bottom: 60,
    },
    sheet_arrowStyle: {
        position: "absolute",
        top: "46.7%",
        left: "32%"
        // marginTop:40
    },

})

